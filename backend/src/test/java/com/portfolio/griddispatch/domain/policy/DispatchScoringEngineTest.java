package com.portfolio.griddispatch.domain.policy;

import com.portfolio.griddispatch.domain.model.Asset;
import com.portfolio.griddispatch.domain.model.Order;
import com.portfolio.griddispatch.domain.valueobject.AssetStatus;
import com.portfolio.griddispatch.domain.valueobject.AssetType;
import com.portfolio.griddispatch.domain.valueobject.Coordinates;
import com.portfolio.griddispatch.domain.valueobject.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class DispatchScoringEngineTest {

    private DispatchScoringEngine engine;
    private Order smallPackageOrder;
    private Order heavyCargoOrder;
    private Coordinates pickupCoords;

    @BeforeEach
    void setUp() {
        engine = new DispatchScoringEngine();
        pickupCoords = new Coordinates(37.7785, -122.3950); // SoMa

        smallPackageOrder = Order.builder()
            .id("ord-test-01")
            .tenantId("tenant-logistics-us")
            .pickupLat(37.7785)
            .pickupLon(-122.3950)
            .dropoffLat(37.7650)
            .dropoffLon(-122.4100)
            .packageWeightKg(new BigDecimal("1.200"))
            .carbonPreference("LOWEST_CARBON")
            .status(OrderStatus.CREATED)
            .slaDeadline(Instant.now().plusSeconds(3600))
            .build();

        heavyCargoOrder = Order.builder()
            .id("ord-test-02")
            .tenantId("tenant-logistics-us")
            .pickupLat(37.7785)
            .pickupLon(-122.3950)
            .dropoffLat(37.7650)
            .dropoffLon(-122.4100)
            .packageWeightKg(new BigDecimal("500.000")) // 500kg
            .carbonPreference("BALANCED")
            .status(OrderStatus.CREATED)
            .slaDeadline(Instant.now().plusSeconds(3600))
            .build();
    }

    @Test
    @DisplayName("Cargo Bike should score highest for small packages with LOWEST_CARBON preference")
    void testCargoBikeFavoredForLowCarbon() {
        Asset bike = Asset.builder()
            .id("bike-1")
            .name("E-Bike 1")
            .type(AssetType.CARGO_BIKE)
            .status(AssetStatus.IDLE)
            .currentLat(37.7780)
            .currentLon(-122.3960)
            .batteryPercent(new BigDecimal("90.00"))
            .rangeKm(new BigDecimal("60.00"))
            .capacityKg(new BigDecimal("100.00"))
            .build();

        Asset van = Asset.builder()
            .id("van-1")
            .name("EV Van 1")
            .type(AssetType.EV_VAN)
            .status(AssetStatus.IDLE)
            .currentLat(37.7780)
            .currentLon(-122.3960)
            .batteryPercent(new BigDecimal("90.00"))
            .rangeKm(new BigDecimal("200.00"))
            .capacityKg(new BigDecimal("1200.00"))
            .build();

        DispatchScoringEngine.CandidateScore bikeScore = engine.scoreCandidate(smallPackageOrder, bike, pickupCoords);
        DispatchScoringEngine.CandidateScore vanScore = engine.scoreCandidate(smallPackageOrder, van, pickupCoords);

        assertTrue(bikeScore.totalScore().compareTo(vanScore.totalScore()) > 0,
            "Cargo Bike score should exceed EV Van score for low-carbon small package delivery");
        assertTrue(bikeScore.estimatedEmissionsKg().compareTo(vanScore.estimatedEmissionsKg()) < 0,
            "Cargo Bike emissions should be strictly lower than EV Van");
    }

    @Test
    @DisplayName("Cargo Bike should be disqualified with zero score when package exceeds capacity")
    void testCapacityDisqualification() {
        Asset bike = Asset.builder()
            .id("bike-2")
            .name("E-Bike 2")
            .type(AssetType.CARGO_BIKE)
            .status(AssetStatus.IDLE)
            .currentLat(37.7780)
            .currentLon(-122.3960)
            .batteryPercent(new BigDecimal("90.00"))
            .rangeKm(new BigDecimal("60.00"))
            .capacityKg(new BigDecimal("100.00")) // Max 100kg vs 500kg order
            .build();

        DispatchScoringEngine.CandidateScore score = engine.scoreCandidate(heavyCargoOrder, bike, pickupCoords);

        assertEquals(BigDecimal.ZERO, score.totalScore());
        assertTrue(score.scoringReasons().contains("Capacity exceeded"));
    }
}
