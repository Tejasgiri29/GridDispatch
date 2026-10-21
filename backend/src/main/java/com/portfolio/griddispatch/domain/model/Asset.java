package com.portfolio.griddispatch.domain.model;

import com.portfolio.griddispatch.domain.valueobject.AssetStatus;
import com.portfolio.griddispatch.domain.valueobject.AssetType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AssetType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AssetStatus status;

    @Column(name = "current_lat", nullable = false)
    private double currentLat;

    @Column(name = "current_lon", nullable = false)
    private double currentLon;

    @Column(name = "battery_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal batteryPercent;

    @Column(name = "range_km", nullable = false, precision = 8, scale = 2)
    private BigDecimal rangeKm;

    @Column(name = "capacity_kg", nullable = false, precision = 8, scale = 2)
    private BigDecimal capacityKg;

    @Column(name = "last_heartbeat", nullable = false)
    private Instant lastHeartbeat;

    @Column(name = "assigned_order_id", length = 64)
    private String assignedOrderId;

    @PrePersist
    public void onPrePersist() {
        if (lastHeartbeat == null) lastHeartbeat = Instant.now();
        if (batteryPercent == null) batteryPercent = new BigDecimal("100.00");
        if (status == null) status = AssetStatus.IDLE;
    }

    public boolean isAvailableForDispatch() {
        return status == AssetStatus.IDLE && batteryPercent.compareTo(new BigDecimal("20.00")) > 0;
    }
}
