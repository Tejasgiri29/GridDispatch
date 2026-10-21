package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.api.dto.response.DashboardStatsResponse;
import com.portfolio.griddispatch.application.service.CarbonAccountingService;
import com.portfolio.griddispatch.config.TenantContext;
import com.portfolio.griddispatch.domain.model.Asset;
import com.portfolio.griddispatch.domain.repository.AssetRepository;
import com.portfolio.griddispatch.domain.repository.ChargingScheduleRepository;
import com.portfolio.griddispatch.domain.repository.IncidentRepository;
import com.portfolio.griddispatch.domain.repository.OrderRepository;
import com.portfolio.griddispatch.domain.valueobject.AssetStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Dashboard & Administration", description = "Live operations KPIs and seed confirmation")
public class AdminSeedController {

    private final OrderRepository orderRepository;
    private final AssetRepository assetRepository;
    private final IncidentRepository incidentRepository;
    private final ChargingScheduleRepository chargingScheduleRepository;
    private final CarbonAccountingService carbonService;

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Get high-level operations dashboard stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        String tenantId = TenantContext.getTenantId();

        long activeOrders = orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).size();
        List<Asset> assets = assetRepository.findByTenantId(tenantId);
        long availableAssets = assets.stream().filter(a -> a.getStatus() == AssetStatus.IDLE).count();
        long activeIncidents = incidentRepository.findByTenantIdAndStatus(tenantId, "OPEN").size();
        BigDecimal totalCarbonSaved = carbonService.getTenantSummary(tenantId).totalSavedKg();

        double avgBattery = assets.isEmpty() ? 100.0 : assets.stream()
            .mapToDouble(a -> a.getBatteryPercent().doubleValue())
            .average().orElse(100.0);

        long activeCharging = chargingScheduleRepository.findByTenantId(tenantId).stream()
            .filter(s -> "SCHEDULED".equalsIgnoreCase(s.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(s.getStatus()))
            .count();

        return ResponseEntity.ok(new DashboardStatsResponse(
            activeOrders,
            availableAssets,
            activeIncidents,
            totalCarbonSaved,
            Math.round(avgBattery * 10.0) / 10.0,
            activeCharging
        ));
    }

    @PostMapping("/admin/seed")
    @Operation(summary = "Re-trigger demo seed confirmation")
    public ResponseEntity<Map<String, String>> seedDemoData() {
        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "message", "GridDispatch database is pre-seeded via Flyway V2 migration script."
        ));
    }
}
