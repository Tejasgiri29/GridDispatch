package com.portfolio.griddispatch.application.service;

import com.portfolio.griddispatch.domain.model.Order;
import com.portfolio.griddispatch.domain.repository.OrderRepository;
import com.portfolio.griddispatch.domain.valueobject.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final DispatchService dispatchService;

    public record CreateOrderCommand(
        String externalOrderId,
        double pickupLat,
        double pickupLon,
        double dropoffLat,
        double dropoffLon,
        BigDecimal packageWeightKg,
        String priority,
        String carbonPreference,
        boolean autoDispatch
    ) {}

    @Transactional
    public Order createOrder(String tenantId, CreateOrderCommand cmd) {
        log.info("Creating delivery order for external ref: {} in tenant: {}", cmd.externalOrderId(), tenantId);

        Order order = Order.builder()
            .id("ord-" + UUID.randomUUID())
            .tenantId(tenantId)
            .externalOrderId(cmd.externalOrderId() != null ? cmd.externalOrderId() : "EXT-" + System.currentTimeMillis())
            .pickupLat(cmd.pickupLat())
            .pickupLon(cmd.pickupLon())
            .dropoffLat(cmd.dropoffLat())
            .dropoffLon(cmd.dropoffLon())
            .packageWeightKg(cmd.packageWeightKg())
            .priority(cmd.priority() != null ? cmd.priority() : "STANDARD")
            .carbonPreference(cmd.carbonPreference() != null ? cmd.carbonPreference() : "LOWEST_CARBON")
            .slaDeadline(Instant.now().plus(60, ChronoUnit.MINUTES))
            .status(OrderStatus.CREATED)
            .build();

        Order saved = orderRepository.save(order);

        if (cmd.autoDispatch()) {
            try {
                dispatchService.dispatchOrder(tenantId, saved.getId());
            } catch (Exception ex) {
                log.warn("Auto-dispatch deferred for Order {}: {}", saved.getId(), ex.getMessage());
            }
        }

        return saved;
    }

    public List<Order> listOrders(String tenantId) {
        return orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public Order getOrder(String tenantId, String orderId) {
        return orderRepository.findByIdAndTenantId(orderId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
    }
}
