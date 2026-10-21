package com.portfolio.griddispatch.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "charging_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChargingSchedule {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "asset_id", nullable = false, length = 64)
    private String assetId;

    @Column(name = "station_id", nullable = false, length = 64)
    private String stationId;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Column(name = "target_battery_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal targetBatteryPercent;

    @Column(name = "estimated_cost_usd", nullable = false, precision = 8, scale = 2)
    private BigDecimal estimatedCostUsd;

    @Column(name = "estimated_carbon_kg", nullable = false, precision = 8, scale = 3)
    private BigDecimal estimatedCarbonKg;

    @Column(nullable = false, length = 32)
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
}
