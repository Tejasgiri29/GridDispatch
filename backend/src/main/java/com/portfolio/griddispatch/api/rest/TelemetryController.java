package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.api.dto.request.TelemetryBatchRequest;
import com.portfolio.griddispatch.application.service.TelemetryIngestionService;
import com.portfolio.griddispatch.config.TenantContext;
import com.portfolio.griddispatch.domain.model.TelemetryEvent;
import com.portfolio.griddispatch.domain.repository.TelemetryEventRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/telemetry")
@RequiredArgsConstructor
@Tag(name = "Telemetry Streaming", description = "High-throughput telemetry ingestion and timeseries historical access")
public class TelemetryController {

    private final TelemetryIngestionService ingestionService;
    private final TelemetryEventRepository telemetryEventRepository;

    @PostMapping("/batch")
    @Operation(summary = "Batch ingest telemetry frames from simulator or gateways")
    public ResponseEntity<Map<String, Object>> ingestBatch(@Valid @RequestBody TelemetryBatchRequest request) {
        String tenantId = TenantContext.getTenantId();
        int count = 0;
        for (TelemetryBatchRequest.TelemetryItem item : request.events()) {
            ingestionService.ingest(tenantId, new TelemetryIngestionService.IngestTelemetryCommand(
                item.assetId(),
                item.latitude(),
                item.longitude(),
                item.speedKmh(),
                item.headingDegrees(),
                item.batteryPercent(),
                item.motorTemperatureC(),
                item.geofenceStatus()
            ));
            count++;
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "ingestedCount", count));
    }

    @GetMapping("/history/{assetId}")
    @Operation(summary = "Get recent telemetry timeline for an asset")
    public ResponseEntity<List<TelemetryEvent>> getHistory(
        @PathVariable String assetId,
        @RequestParam(defaultValue = "50") int limit
    ) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(telemetryEventRepository.findByTenantIdAndAssetIdOrderByTimestampDesc(
            tenantId, assetId, PageRequest.of(0, Math.min(limit, 200))
        ));
    }
}
