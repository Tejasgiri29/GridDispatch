package com.portfolio.griddispatch.application.service;

import com.portfolio.griddispatch.domain.model.Asset;
import com.portfolio.griddispatch.domain.model.DispatchAssignment;
import com.portfolio.griddispatch.domain.model.Order;
import com.portfolio.griddispatch.domain.model.Route;
import com.portfolio.griddispatch.domain.policy.DispatchScoringEngine;
import com.portfolio.griddispatch.domain.repository.AssetRepository;
import com.portfolio.griddispatch.domain.repository.DispatchAssignmentRepository;
import com.portfolio.griddispatch.domain.repository.OrderRepository;
import com.portfolio.griddispatch.domain.repository.RouteRepository;
import com.portfolio.griddispatch.domain.valueobject.AssetStatus;
import com.portfolio.griddispatch.domain.valueobject.Coordinates;
import com.portfolio.griddispatch.domain.valueobject.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DispatchService {

    private final OrderRepository orderRepository;
    private final AssetRepository assetRepository;
    private final DispatchAssignmentRepository assignmentRepository;
    private final RouteRepository routeRepository;
    private final DispatchScoringEngine scoringEngine;

    @Transactional
    public DispatchAssignment dispatchOrder(String tenantId, String orderId) {
        log.info("Solving Pareto-optimal dispatch assignment for Order: {} in Tenant: {}", orderId, tenantId);

        Order order = orderRepository.findByIdAndTenantId(orderId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        Coordinates pickupCoords = new Coordinates(order.getPickupLat(), order.getPickupLon());

        List<Asset> candidates = assetRepository.findByTenantIdAndStatus(tenantId, AssetStatus.IDLE);
        if (candidates.isEmpty()) {
            throw new IllegalStateException("No available assets in fleet for dispatch");
        }

        List<DispatchScoringEngine.CandidateScore> scored = candidates.stream()
            .map(a -> scoringEngine.scoreCandidate(order, a, pickupCoords))
            .filter(cs -> cs.totalScore().doubleValue() > 0.0)
            .sorted(Comparator.comparing(DispatchScoringEngine.CandidateScore::totalScore).reversed())
            .toList();

        if (scored.isEmpty()) {
            throw new IllegalStateException("No candidate asset satisfies weight, range, or battery criteria");
        }

        DispatchScoringEngine.CandidateScore best = scored.get(0);
        Asset selectedAsset = best.asset();

        // Update asset state
        selectedAsset.setStatus(AssetStatus.ASSIGNED);
        selectedAsset.setAssignedOrderId(order.getId());
        assetRepository.save(selectedAsset);

        // Update order state
        order.setStatus(OrderStatus.ASSET_ASSIGNED);
        orderRepository.save(order);

        // Create explainable assignment record
        Instant pickupTime = Instant.now().plus(Math.max(5, (int)(best.distanceKm() * 1.5)), ChronoUnit.MINUTES);
        Instant deliveryTime = pickupTime.plus(best.estimatedDurationMin(), ChronoUnit.MINUTES);

        DispatchAssignment assignment = DispatchAssignment.builder()
            .id("disp-" + UUID.randomUUID())
            .tenantId(tenantId)
            .orderId(order.getId())
            .assetId(selectedAsset.getId())
            .score(best.totalScore())
            .scoringReasons(String.join("; ", best.scoringReasons()))
            .estimatedPickupTime(pickupTime)
            .estimatedDeliveryTime(deliveryTime)
            .estimatedEnergyKwh(best.estimatedEnergyKwh())
            .estimatedEmissionsKg(best.estimatedEmissionsKg())
            .status("ASSIGNED")
            .build();
        assignmentRepository.save(assignment);

        // Create planned route
        Route route = Route.builder()
            .id("rt-" + UUID.randomUUID())
            .tenantId(tenantId)
            .orderId(order.getId())
            .assetId(selectedAsset.getId())
            .distanceKm(java.math.BigDecimal.valueOf(best.distanceKm()).setScale(2, java.math.RoundingMode.HALF_UP))
            .estimatedDurationMin(best.estimatedDurationMin())
            .estimatedEmissionsKg(best.estimatedEmissionsKg())
            .status("PLANNED")
            .polylineGeoJson(String.format("{\"type\":\"LineString\",\"coordinates\":[[%f,%f],[%f,%f],[%f,%f]]}",
                selectedAsset.getCurrentLon(), selectedAsset.getCurrentLat(),
                order.getPickupLon(), order.getPickupLat(),
                order.getDropoffLon(), order.getDropoffLat()))
            .build();
        routeRepository.save(route);

        log.info("Order {} successfully assigned to Asset {} with Score: {}", orderId, selectedAsset.getName(), best.totalScore());
        return assignment;
    }
}
