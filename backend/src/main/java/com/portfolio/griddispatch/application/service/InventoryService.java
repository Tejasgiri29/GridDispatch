package com.portfolio.griddispatch.application.service;

import com.portfolio.griddispatch.domain.model.InventoryItem;
import com.portfolio.griddispatch.domain.model.InventoryReservation;
import com.portfolio.griddispatch.domain.repository.InventoryItemRepository;
import com.portfolio.griddispatch.domain.repository.InventoryReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryReservationRepository reservationRepository;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public InventoryReservation reserveStock(String tenantId, String orderId, String warehouseId, String productId, int quantity, int ttlMinutes) {
        log.info("Acquiring pessimistic write lock for Warehouse: {}, Product: {}, Quantity: {}", warehouseId, productId, quantity);

        // Pessimistic Row Locking prevents any race conditions or overselling
        InventoryItem item = inventoryItemRepository.findWithLockByWarehouseIdAndProductIdAndTenantId(warehouseId, productId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Inventory item not found in warehouse: " + warehouseId));

        if (!item.canReserve(quantity)) {
            log.warn("Overselling prevented! Available: {}, Requested: {}", item.getAvailableQuantity(), quantity);
            throw new IllegalStateException("Insufficient inventory: only " + item.getAvailableQuantity() + " available, requested " + quantity);
        }

        item.reserve(quantity);
        inventoryItemRepository.save(item);

        InventoryReservation reservation = InventoryReservation.builder()
            .id("res-" + UUID.randomUUID())
            .tenantId(tenantId)
            .orderId(orderId)
            .warehouseId(warehouseId)
            .productId(productId)
            .quantity(quantity)
            .status("RESERVED")
            .expiresAt(Instant.now().plus(ttlMinutes, ChronoUnit.MINUTES))
            .build();

        return reservationRepository.save(reservation);
    }

    @Transactional
    public void confirmReservation(String tenantId, String reservationId) {
        InventoryReservation reservation = reservationRepository.findByIdAndTenantId(reservationId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Reservation not found: " + reservationId));

        if (!"RESERVED".equalsIgnoreCase(reservation.getStatus())) {
            return;
        }

        InventoryItem item = inventoryItemRepository.findWithLockByWarehouseIdAndProductIdAndTenantId(
            reservation.getWarehouseId(), reservation.getProductId(), tenantId
        ).orElseThrow();

        item.confirm(reservation.getQuantity());
        inventoryItemRepository.save(item);

        reservation.setStatus("CONFIRMED");
        reservationRepository.save(reservation);
        log.info("Reservation {} confirmed and permanently deducted.", reservationId);
    }

    @Transactional
    public void releaseReservation(String tenantId, String reservationId) {
        InventoryReservation reservation = reservationRepository.findByIdAndTenantId(reservationId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Reservation not found: " + reservationId));

        if (!"RESERVED".equalsIgnoreCase(reservation.getStatus())) {
            return;
        }

        InventoryItem item = inventoryItemRepository.findWithLockByWarehouseIdAndProductIdAndTenantId(
            reservation.getWarehouseId(), reservation.getProductId(), tenantId
        ).orElseThrow();

        item.release(reservation.getQuantity());
        inventoryItemRepository.save(item);

        reservation.setStatus("RELEASED");
        reservationRepository.save(reservation);
        log.info("Reservation {} released back to available pool.", reservationId);
    }

    // Background job releasing expired reservation holds every 30 seconds
    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void cleanExpiredReservations() {
        List<InventoryReservation> expired = reservationRepository.findByStatusAndExpiresAtBefore("RESERVED", Instant.now());
        if (expired.isEmpty()) return;

        log.info("Sweeping {} expired inventory reservations...", expired.size());
        for (InventoryReservation res : expired) {
            try {
                releaseReservation(res.getTenantId(), res.getId());
            } catch (Exception ex) {
                log.error("Failed to release expired reservation {}: {}", res.getId(), ex.getMessage());
            }
        }
    }
}
