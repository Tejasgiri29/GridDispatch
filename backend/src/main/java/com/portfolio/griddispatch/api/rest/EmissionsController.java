package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.application.service.CarbonAccountingService;
import com.portfolio.griddispatch.config.TenantContext;
import com.portfolio.griddispatch.domain.model.EmissionReport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/emissions")
@RequiredArgsConstructor
@Tag(name = "Carbon Accounting", description = "Audit-grade emissions calculation and carbon offset analytics")
public class EmissionsController {

    private final CarbonAccountingService carbonService;

    @GetMapping("/reports")
    @Operation(summary = "List order emission reports")
    public ResponseEntity<List<EmissionReport>> listReports() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(carbonService.listReports(tenantId));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get aggregated carbon emissions and savings vs diesel baseline")
    public ResponseEntity<CarbonAccountingService.CarbonSummary> getSummary() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(carbonService.getTenantSummary(tenantId));
    }
}
