package com.portfolio.griddispatch.domain.policy;

import com.portfolio.griddispatch.domain.model.Asset;
import com.portfolio.griddispatch.domain.model.Order;
import com.portfolio.griddispatch.domain.valueobject.AssetType;
import com.portfolio.griddispatch.domain.valueobject.Coordinates;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Component
public class DispatchScoringEngine {

    public record CandidateScore(
        Asset asset,
        BigDecimal totalScore,
        List<String> scoringReasons,
        double distanceKm,
        int estimatedDurationMin,
        BigDecimal estimatedEnergyKwh,
        BigDecimal estimatedEmissionsKg
    ) {}

    public CandidateScore scoreCandidate(Order order, Asset asset, Coordinates pickupCoords) {
        Coordinates assetCoords = new Coordinates(asset.getCurrentLat(), asset.getCurrentLon());
        Coordinates dropoffCoords = new Coordinates(order.getDropoffLat(), order.getDropoffLon());

        double pickupDistKm = assetCoords.distanceToKm(pickupCoords);
        double deliveryDistKm = pickupCoords.distanceToKm(dropoffCoords);
        double totalDistKm = pickupDistKm + deliveryDistKm;

        List<String> reasons = new ArrayList<>();

        // 1. Capacity Fit (Hard Constraint)
        if (asset.getCapacityKg().compareTo(order.getPackageWeightKg()) < 0) {
            return new CandidateScore(asset, BigDecimal.ZERO, List.of("Capacity exceeded"), totalDistKm, 999, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        // 2. Battery Range Fit (Hard Constraint)
        if (asset.getRangeKm().doubleValue() < totalDistKm * 1.3) {
            return new CandidateScore(asset, BigDecimal.ZERO, List.of("Insufficient battery range for round-trip"), totalDistKm, 999, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        // 3. Multi-Objective Evaluation
        // Distance Score: closer is better (normalized up to 25km)
        double distanceScore = Math.max(0.0, 1.0 - (pickupDistKm / 25.0));
        reasons.add(String.format("Distance to pickup: %.1f km (weight: 25%%)", pickupDistKm));

        // Speed & ETA Estimation
        int speedKmh = getAverageSpeedKmh(asset.getType());
        int durationMin = (int) Math.ceil((totalDistKm / speedKmh) * 60.0) + 5; // +5m handling
        double etaScore = Math.max(0.0, 1.0 - (durationMin / 90.0));
        reasons.add(String.format("Estimated total duration: %d min (avg speed %d km/h)", durationMin, speedKmh));

        // Battery Health Score
        double batteryScore = asset.getBatteryPercent().doubleValue() / 100.0;
        reasons.add(String.format("Battery level: %.1f%%", asset.getBatteryPercent().doubleValue()));

        // Carbon & Energy Calculations
        double kwhPerKm = getEnergyConsumptionKwhPerKm(asset.getType());
        BigDecimal energyKwh = BigDecimal.valueOf(totalDistKm * kwhPerKm).setScale(2, RoundingMode.HALF_UP);
        // Clean fleet: grams CO2 per kWh ~ 50g (clean grid) vs 180g diesel baseline
        BigDecimal emissionsKg = energyKwh.multiply(BigDecimal.valueOf(0.050)).setScale(3, RoundingMode.HALF_UP);

        double carbonScore = switch (asset.getType()) {
            case CARGO_BIKE -> 1.0;
            case ROBOT -> 0.95;
            case DRONE -> 0.85;
            case EV_VAN -> 0.75;
            case TRUCK -> 0.50;
        };
        reasons.add(String.format("Emissions profile: %.3f kg CO2 (%s)", emissionsKg.doubleValue(), asset.getType()));

        // Apply preference weights
        double wDistance = 0.25;
        double wEta = 0.25;
        double wBattery = 0.20;
        double wCarbon = 0.30;

        if ("LOWEST_CARBON".equalsIgnoreCase(order.getCarbonPreference())) {
            wCarbon = 0.45;
            wEta = 0.15;
        } else if ("FASTEST".equalsIgnoreCase(order.getCarbonPreference())) {
            wEta = 0.45;
            wCarbon = 0.15;
        }

        double finalScore = (distanceScore * wDistance) + (etaScore * wEta) + (batteryScore * wBattery) + (carbonScore * wCarbon);
        BigDecimal score = BigDecimal.valueOf(Math.max(0.01, finalScore)).setScale(4, RoundingMode.HALF_UP);

        return new CandidateScore(asset, score, reasons, totalDistKm, durationMin, energyKwh, emissionsKg);
    }

    private int getAverageSpeedKmh(AssetType type) {
        return switch (type) {
            case CARGO_BIKE -> 20;
            case ROBOT -> 6;
            case DRONE -> 60;
            case EV_VAN -> 35;
            case TRUCK -> 30;
        };
    }

    private double getEnergyConsumptionKwhPerKm(AssetType type) {
        return switch (type) {
            case CARGO_BIKE -> 0.03;
            case ROBOT -> 0.05;
            case DRONE -> 0.12;
            case EV_VAN -> 0.25;
            case TRUCK -> 0.90;
        };
    }
}
