package com.portfolio.griddispatch.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "telemetry_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetryEvent {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "asset_id", nullable = false, length = 64)
    private String assetId;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "speed_kmh", nullable = false, precision = 6, scale = 2)
    private BigDecimal speedKmh;

    @Column(name = "heading_degrees", nullable = false, precision = 5, scale = 2)
    private BigDecimal headingDegrees;

    @Column(name = "battery_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal batteryPercent;

    @Column(name = "motor_temperature_c", precision = 5, scale = 2)
    private BigDecimal motorTemperatureC;

    @Column(name = "geofence_status", nullable = false, length = 32)
    private String geofenceStatus;

    @PrePersist
    public void onPrePersist() {
        if (timestamp == null) timestamp = Instant.now();
        if (geofenceStatus == null) geofenceStatus = "INSIDE";
    }
}
