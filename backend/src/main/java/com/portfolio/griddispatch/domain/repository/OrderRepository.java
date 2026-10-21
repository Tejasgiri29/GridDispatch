package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.Order;
import com.portfolio.griddispatch.domain.valueobject.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    Optional<Order> findByIdAndTenantId(String id, String tenantId);
    List<Order> findByTenantIdAndStatus(String tenantId, OrderStatus status);
}
