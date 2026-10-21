package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.DispatchAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchAssignmentRepository extends JpaRepository<DispatchAssignment, String> {
    List<DispatchAssignment> findByTenantId(String tenantId);
    Optional<DispatchAssignment> findByOrderIdAndTenantId(String orderId, String tenantId);
}
