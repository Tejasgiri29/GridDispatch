package com.portfolio.griddispatch.application.service;

import com.portfolio.griddispatch.config.KafkaConfig;
import com.portfolio.griddispatch.domain.model.Asset;
import com.portfolio.griddispatch.domain.model.Incident;
import com.portfolio.griddispatch.domain.model.TelemetryEvent;
import com.portfolio.griddispatch.domain.policy.AnomalyDetectionEngine;
import com.portfolio.griddispatch.domain.repository.AssetRepository;
import com.portfolio.griddispatch.domain.repository.IncidentRepository;
import com.portfolio.griddispatch.domain.repository.TelemetryEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryIngestionService {

    private final TelemetryEventRepository telemetryEventRepository;
    private final AssetRepository assetRepository;
    private final IncidentRepository incidentRepository;
    private final AnomalyDetectionEngine anomalyDetectionEngine;
    private final StringRedisTemplate redisTemplate;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    public record IngestTelemetryCommand(
        String assetId,
        double latitude,
        double longitude,
        double speedKmh,
        double headingDegrees,
        double batteryPercent,
        Double motorTemperatureC,
        String geofenceStatus
    ) {}

    @Transactional
    public TelemetryEvent ingest(String tenantId, IngestTelemetryCommand cmd) {
        Asset asset = assetRepository.findByIdAndTenantId(cmd.assetId(), tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + cmd.assetId()));

        Optional<TelemetryEvent> previousEvent = telemetryEventRepository.findFirstByTenantIdAndAssetIdOrderByTimestampDesc(tenantId, asset.getId());

        TelemetryEvent current = TelemetryEvent.builder()
            .id("tele-" + UUID.randomUUID())
            .tenantId(tenantId)
            .assetId(asset.getId())
            .timestamp(Instant.now())
            .latitude(cmd.latitude())
            .longitude(cmd.longitude())
            .speedKmh(BigDecimal.valueOf(cmd.speedKmh()))
            .headingDegrees(BigDecimal.valueOf(cmd.headingDegrees()))
            .batteryPercent(BigDecimal.valueOf(cmd.batteryPercent()))
            .motorTemperatureC(cmd.motorTemperatureC() != null ? BigDecimal.valueOf(cmd.motorTemperatureC()) : null)
            .geofenceStatus(cmd.geofenceStatus() != null ? cmd.geofenceStatus() : "INSIDE")
            .build();

        telemetryEventRepository.save(current);

        // Update live state in database
        asset.setCurrentLat(cmd.latitude());
        asset.setCurrentLon(cmd.longitude());
        asset.setBatteryPercent(BigDecimal.valueOf(cmd.batteryPercent()));
        asset.setLastHeartbeat(Instant.now());
        assetRepository.save(asset);

        // Store latest location in Redis for ultra-fast spatial and dashboard lookups
        String redisKey = "asset:pos:" + tenantId + ":" + asset.getId();
        String posValue = cmd.latitude() + "," + cmd.longitude() + "," + cmd.speedKmh() + "," + cmd.batteryPercent();
        redisTemplate.opsForValue().set(redisKey, posValue);

        // Check for anomalies (Impossible speed, rapid drain, geofence breaches)
        Optional<Incident> incidentOpt = anomalyDetectionEngine.evaluateTelemetry(asset, current, previousEvent.orElse(null));
        if (incidentOpt.isPresent()) {
            Incident incident = incidentOpt.get();
            incidentRepository.save(incident);
            log.warn("Operational Anomaly detected for Asset {}: {}", asset.getId(), incident.getDescription());

            // Emit incident alert to Kafka & WebSocket
            kafkaTemplate.send(KafkaConfig.TOPIC_ANOMALY_DETECTED, asset.getId(), incident.getDescription());
            messagingTemplate.convertAndSend("/topic/incidents", incident);
        }

        // Broadcast realtime position to connected frontend dashboards via STOMP WebSocket
        messagingTemplate.convertAndSend("/topic/telemetry/" + tenantId, current);

        return current;
    }
}
