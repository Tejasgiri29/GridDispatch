package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, String> {
    List<Warehouse> findByTenantIdAndActiveTrue(String tenantId);
    Optional<Warehouse> findByIdAndTenantId(String id, String tenantId);
}
