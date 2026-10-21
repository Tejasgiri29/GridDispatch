package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.EmissionReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmissionReportRepository extends JpaRepository<EmissionReport, String> {
    List<EmissionReport> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
