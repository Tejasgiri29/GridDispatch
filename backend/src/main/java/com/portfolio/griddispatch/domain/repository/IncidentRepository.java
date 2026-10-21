package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {
    List<Incident> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<Incident> findByTenantIdAndStatus(String tenantId, String status);
    Optional<Incident> findByIdAndTenantId(String id, String tenantId);
}
