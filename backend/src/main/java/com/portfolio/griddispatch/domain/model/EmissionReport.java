package com.portfolio.griddispatch.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "emission_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmissionReport {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "order_id", nullable = false, length = 64)
    private String orderId;

    @Column(name = "asset_id", nullable = false, length = 64)
    private String assetId;

    @Column(name = "distance_km", nullable = false, precision = 8, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "calculated_co2_kg", nullable = false, precision = 8, scale = 3)
    private BigDecimal calculatedCo2Kg;

    @Column(name = "diesel_baseline_co2_kg", nullable = false, precision = 8, scale = 3)
    private BigDecimal dieselBaselineCo2Kg;

    @Column(name = "co2_saved_kg", nullable = false, precision = 8, scale = 3)
    private BigDecimal co2SavedKg;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
