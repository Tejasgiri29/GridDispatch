package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.config.TenantContext;
import com.portfolio.griddispatch.domain.model.Asset;
import com.portfolio.griddispatch.domain.repository.AssetRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fleet")
@RequiredArgsConstructor
@Tag(name = "Fleet Registry", description = "Autonomous electric assets (Vans, Bikes, Robots, Drones)")
public class FleetController {

    private final AssetRepository assetRepository;

    @GetMapping("/assets")
    @Operation(summary = "List all movable assets in fleet")
    public ResponseEntity<List<Asset>> listAssets() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(assetRepository.findByTenantId(tenantId));
    }

    @GetMapping("/assets/{id}")
    @Operation(summary = "Get asset telemetry and state by ID")
    public ResponseEntity<Asset> getAsset(@PathVariable String id) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(assetRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id)));
    }
}
