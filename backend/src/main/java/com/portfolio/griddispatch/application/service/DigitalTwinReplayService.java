package com.portfolio.griddispatch.application.service;

import com.portfolio.griddispatch.domain.model.TelemetryEvent;
import com.portfolio.griddispatch.domain.repository.TelemetryEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DigitalTwinReplayService {

    private final TelemetryEventRepository telemetryEventRepository;

    public record ReplayFrame(
        String assetId,
        Instant timestamp,
        double latitude,
        double longitude,
        double speedKmh,
        double batteryPercent
    ) {}

    public List<ReplayFrame> getReplayFrames(String tenantId, Instant from, Instant to) {
        List<TelemetryEvent> events = telemetryEventRepository.findByTenantIdAndTimestampBetweenOrderByTimestampAsc(tenantId, from, to);
        return events.stream()
            .map(e -> new ReplayFrame(
                e.getAssetId(),
                e.getTimestamp(),
                e.getLatitude(),
                e.getLongitude(),
                e.getSpeedKmh().doubleValue(),
                e.getBatteryPercent().doubleValue()
            ))
            .toList();
    }
}
