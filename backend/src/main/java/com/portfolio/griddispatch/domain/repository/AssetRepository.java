package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.Asset;
import com.portfolio.griddispatch.domain.valueobject.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends JpaRepository<Asset, String> {
    List<Asset> findByTenantId(String tenantId);
    Optional<Asset> findByIdAndTenantId(String id, String tenantId);
    List<Asset> findByTenantIdAndStatus(String tenantId, AssetStatus status);
}
