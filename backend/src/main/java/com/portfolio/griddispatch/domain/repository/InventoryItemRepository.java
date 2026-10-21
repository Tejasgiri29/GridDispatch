package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.InventoryItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    List<InventoryItem> findByTenantIdAndWarehouseId(String tenantId, String warehouseId);
    List<InventoryItem> findByTenantId(String tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryItem i WHERE i.warehouseId = :warehouseId AND i.productId = :productId AND i.tenantId = :tenantId")
    Optional<InventoryItem> findWithLockByWarehouseIdAndProductIdAndTenantId(
        @Param("warehouseId") String warehouseId,
        @Param("productId") String productId,
        @Param("tenantId") String tenantId
    );
}
