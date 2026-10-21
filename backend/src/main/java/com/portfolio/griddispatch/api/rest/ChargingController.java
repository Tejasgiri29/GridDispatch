package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.application.service.ChargingSchedulerService;
import com.portfolio.griddispatch.config.TenantContext;
import com.portfolio.griddispatch.domain.model.ChargingSchedule;
import com.portfolio.griddispatch.domain.model.ChargingStation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/charging")
@RequiredArgsConstructor
@Tag(name = "Energy & Charging", description = "Carbon-aware EV charging schedules and station network")
public class ChargingController {

    private final ChargingSchedulerService chargingService;

    @GetMapping("/stations")
    @Operation(summary = "List charging stations")
    public ResponseEntity<List<ChargingStation>> listStations() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(chargingService.listStations(tenantId));
    }

    @GetMapping("/schedules")
    @Operation(summary = "List scheduled and active charging sessions")
    public ResponseEntity<List<ChargingSchedule>> listSchedules() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(chargingService.listSchedules(tenantId));
    }

    @PostMapping("/schedule")
    @Operation(summary = "Schedule optimal charging session based on grid carbon intensity")
    public ResponseEntity<ChargingSchedule> scheduleCharge(
        @RequestParam String assetId,
        @RequestParam String stationId
    ) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.status(HttpStatus.CREATED).body(
            chargingService.scheduleOptimalCharge(tenantId, assetId, stationId)
        );
    }
}
