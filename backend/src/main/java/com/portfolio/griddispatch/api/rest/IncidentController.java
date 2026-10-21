package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.api.dto.request.ResolveIncidentRequest;
import com.portfolio.griddispatch.application.service.AnomalyDetectionService;
import com.portfolio.griddispatch.config.TenantContext;
import com.portfolio.griddispatch.domain.model.Incident;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
@Tag(name = "Incidents & Anomalies", description = "Operational risk, anomaly alerts, and incident resolution inbox")
public class IncidentController {

    private final AnomalyDetectionService anomalyService;

    @GetMapping
    @Operation(summary = "List all operational incidents and anomaly alerts")
    public ResponseEntity<List<Incident>> listIncidents() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(anomalyService.listIncidents(tenantId));
    }

    @PostMapping("/{id}/acknowledge")
    @Operation(summary = "Acknowledge active operational anomaly")
    public ResponseEntity<Incident> acknowledgeIncident(@PathVariable String id) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(anomalyService.acknowledgeIncident(tenantId, id));
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Resolve incident with dispatcher notes")
    public ResponseEntity<Incident> resolveIncident(
        @PathVariable String id,
        @Valid @RequestBody ResolveIncidentRequest request
    ) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(anomalyService.resolveIncident(tenantId, id, request.resolutionNotes()));
    }
}
