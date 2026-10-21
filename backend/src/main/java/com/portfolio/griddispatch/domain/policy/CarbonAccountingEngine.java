package com.portfolio.griddispatch.domain.policy;

import com.portfolio.griddispatch.domain.model.EmissionReport;
import com.portfolio.griddispatch.domain.valueobject.AssetType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Component
public class CarbonAccountingEngine {

    // Standard baseline diesel delivery van emits approximately 0.260 kg CO2 per km
    private static final double DIESEL_BASELINE_KG_PER_KM = 0.260;

    public EmissionReport calculateOrderEmissions(String tenantId, String orderId, String assetId, AssetType assetType, double distanceKm) {
        double factorKgPerKm = switch (assetType) {
            case CARGO_BIKE -> 0.001; // Human + minimal electric assist
            case ROBOT -> 0.004;      // Sidewalk electric bot
            case DRONE -> 0.012;      // Aerodynamic electric drone
            case EV_VAN -> 0.038;     // Modern electric delivery van (California clean grid)
            case TRUCK -> 0.110;      // Class 6 electric truck
        };

        BigDecimal calculatedCo2 = BigDecimal.valueOf(distanceKm * factorKgPerKm).setScale(3, RoundingMode.HALF_UP);
        BigDecimal dieselBaseline = BigDecimal.valueOf(distanceKm * DIESEL_BASELINE_KG_PER_KM).setScale(3, RoundingMode.HALF_UP);
        BigDecimal co2Saved = dieselBaseline.subtract(calculatedCo2).max(BigDecimal.ZERO).setScale(3, RoundingMode.HALF_UP);

        return EmissionReport.builder()
            .id("em-" + UUID.randomUUID())
            .tenantId(tenantId)
            .orderId(orderId)
            .assetId(assetId)
            .distanceKm(BigDecimal.valueOf(distanceKm).setScale(2, RoundingMode.HALF_UP))
            .calculatedCo2Kg(calculatedCo2)
            .dieselBaselineCo2Kg(dieselBaseline)
            .co2SavedKg(co2Saved)
            .build();
    }
}
