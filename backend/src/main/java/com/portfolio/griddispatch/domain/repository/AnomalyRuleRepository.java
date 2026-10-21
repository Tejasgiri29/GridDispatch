package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.AnomalyRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnomalyRuleRepository extends JpaRepository<AnomalyRule, String> {
    List<AnomalyRule> findByTenantIdAndActiveTrue(String tenantId);
}
