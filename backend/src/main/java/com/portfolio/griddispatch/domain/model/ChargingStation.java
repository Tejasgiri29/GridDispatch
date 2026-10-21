package com.portfolio.griddispatch.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "charging_stations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChargingStation {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "total_plugs", nullable = false)
    private int totalPlugs;

    @Column(name = "available_plugs", nullable = false)
    private int availablePlugs;

    @Column(name = "power_kw", nullable = false, precision = 6, scale = 2)
    private BigDecimal powerKw;

    @Column(name = "grid_source", nullable = false, length = 64)
    private String gridSource;
}
