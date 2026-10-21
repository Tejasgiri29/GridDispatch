package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.ChargingStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargingStationRepository extends JpaRepository<ChargingStation, String> {
    List<ChargingStation> findByTenantId(String tenantId);
}
