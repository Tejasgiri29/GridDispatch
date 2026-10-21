package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.api.dto.request.CreateOrderRequest;
import com.portfolio.griddispatch.application.service.OrderService;
import com.portfolio.griddispatch.config.TenantContext;
import com.portfolio.griddispatch.domain.model.Order;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Delivery Orders", description = "Autonomous logistics order lifecycle and routing")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Create delivery order", description = "Submits an order with geospatial pickup/dropoff coordinates and carbon preference")
    public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        String tenantId = TenantContext.getTenantId();
        Order order = orderService.createOrder(tenantId, new OrderService.CreateOrderCommand(
            request.externalOrderId(),
            request.pickupLat(),
            request.pickupLon(),
            request.dropoffLat(),
            request.dropoffLon(),
            request.packageWeightKg(),
            request.priority(),
            request.carbonPreference(),
            request.autoDispatch()
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping
    @Operation(summary = "List delivery orders")
    public ResponseEntity<List<Order>> listOrders() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(orderService.listOrders(tenantId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details")
    public ResponseEntity<Order> getOrder(@PathVariable String id) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(orderService.getOrder(tenantId, id));
    }
}
