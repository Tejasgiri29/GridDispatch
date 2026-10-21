package com.portfolio.griddispatch.domain.model;

import com.portfolio.griddispatch.domain.valueobject.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "external_order_id", length = 128)
    private String externalOrderId;

    @Column(name = "pickup_lat", nullable = false)
    private double pickupLat;

    @Column(name = "pickup_lon", nullable = false)
    private double pickupLon;

    @Column(name = "dropoff_lat", nullable = false)
    private double dropoffLat;

    @Column(name = "dropoff_lon", nullable = false)
    private double dropoffLon;

    @Column(name = "package_weight_kg", nullable = false, precision = 8, scale = 3)
    private BigDecimal packageWeightKg;

    @Column(nullable = false, length = 32)
    private String priority; // STANDARD, HIGH, CRITICAL

    @Column(name = "sla_deadline", nullable = false)
    private Instant slaDeadline;

    @Column(name = "carbon_preference", nullable = false, length = 32)
    private String carbonPreference; // LOWEST_CARBON, FASTEST, BALANCED

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private OrderStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (status == null) status = OrderStatus.CREATED;
    }

    @PreUpdate
    public void onPreUpdate() {
        updatedAt = Instant.now();
    }
}
