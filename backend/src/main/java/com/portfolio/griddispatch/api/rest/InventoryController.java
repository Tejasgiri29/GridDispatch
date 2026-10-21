package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.api.dto.request.ReserveInventoryRequest;
import com.portfolio.griddispatch.application.service.InventoryService;
import com.portfolio.griddispatch.config.TenantContext;
import com.portfolio.griddispatch.domain.model.InventoryItem;
import com.portfolio.griddispatch.domain.model.InventoryReservation;
import com.portfolio.griddispatch.domain.repository.InventoryItemRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory & Reservations", description = "High-concurrency zero-oversell stock management and lease TTLs")
public class InventoryController {

    private final InventoryService inventoryService;
    private final InventoryItemRepository inventoryItemRepository;

    @GetMapping("/items")
    @Operation(summary = "List warehouse inventory items")
    public ResponseEntity<List<InventoryItem>> listItems() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(inventoryItemRepository.findByTenantId(tenantId));
    }

    @PostMapping("/reserve")
    @Operation(summary = "Reserve stock with pessimistic lock")
    public ResponseEntity<InventoryReservation> reserveStock(@Valid @RequestBody ReserveInventoryRequest request) {
        String tenantId = TenantContext.getTenantId();
        InventoryReservation res = inventoryService.reserveStock(
            tenantId, request.orderId(), request.warehouseId(), request.productId(), request.quantity(), request.ttlMinutes()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PostMapping("/reservations/{id}/confirm")
    @Operation(summary = "Confirm stock reservation on delivery fulfillment")
    public ResponseEntity<Void> confirmReservation(@PathVariable String id) {
        String tenantId = TenantContext.getTenantId();
        inventoryService.confirmReservation(tenantId, id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reservations/{id}/release")
    @Operation(summary = "Release stock reservation on order cancellation")
    public ResponseEntity<Void> releaseReservation(@PathVariable String id) {
        String tenantId = TenantContext.getTenantId();
        inventoryService.releaseReservation(tenantId, id);
        return ResponseEntity.ok().build();
    }
}
