package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.ChargingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargingScheduleRepository extends JpaRepository<ChargingSchedule, String> {
    List<ChargingSchedule> findByTenantId(String tenantId);
    List<ChargingSchedule> findByTenantIdAndAssetId(String tenantId, String assetId);
}
