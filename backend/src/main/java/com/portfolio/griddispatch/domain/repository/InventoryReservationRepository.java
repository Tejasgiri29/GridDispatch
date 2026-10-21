package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.InventoryReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, String> {
    List<InventoryReservation> findByTenantIdAndOrderId(String tenantId, String orderId);
    Optional<InventoryReservation> findByIdAndTenantId(String id, String tenantId);
    List<InventoryReservation> findByStatusAndExpiresAtBefore(String status, Instant now);
}
