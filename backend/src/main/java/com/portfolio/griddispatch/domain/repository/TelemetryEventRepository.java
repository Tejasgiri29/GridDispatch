package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.TelemetryEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TelemetryEventRepository extends JpaRepository<TelemetryEvent, String> {
    List<TelemetryEvent> findByTenantIdAndAssetIdOrderByTimestampDesc(String tenantId, String assetId, Pageable pageable);
    Optional<TelemetryEvent> findFirstByTenantIdAndAssetIdOrderByTimestampDesc(String tenantId, String assetId);
    List<TelemetryEvent> findByTenantIdAndTimestampBetweenOrderByTimestampAsc(String tenantId, Instant from, Instant to);
}
