package com.portfolio.griddispatch.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "routes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {

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

    @Column(name = "estimated_duration_min", nullable = false)
    private int estimatedDurationMin;

    @Column(name = "estimated_emissions_kg", nullable = false, precision = 8, scale = 3)
    private BigDecimal estimatedEmissionsKg;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "polyline_geojson", columnDefinition = "TEXT")
    private String polylineGeoJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = "PLANNED";
    }
}
