package com.portfolio.griddispatch.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "dispatch_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchAssignment {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "order_id", nullable = false, length = 64)
    private String orderId;

    @Column(name = "asset_id", nullable = false, length = 64)
    private String assetId;

    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal score;

    @Column(name = "scoring_reasons", nullable = false, columnDefinition = "TEXT")
    private String scoringReasons;

    @Column(name = "estimated_pickup_time", nullable = false)
    private Instant estimatedPickupTime;

    @Column(name = "estimated_delivery_time", nullable = false)
    private Instant estimatedDeliveryTime;

    @Column(name = "estimated_energy_kwh", nullable = false, precision = 8, scale = 2)
    private BigDecimal estimatedEnergyKwh;

    @Column(name = "estimated_emissions_kg", nullable = false, precision = 8, scale = 3)
    private BigDecimal estimatedEmissionsKg;

    @Column(nullable = false, length = 32)
    private String status; // ASSIGNED, EN_ROUTE, DELIVERED, REASSIGNED

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = "ASSIGNED";
    }
}
