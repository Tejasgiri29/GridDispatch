package com.portfolio.griddispatch.domain.repository;

import com.portfolio.griddispatch.domain.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteRepository extends JpaRepository<Route, String> {
    List<Route> findByTenantId(String tenantId);
    Optional<Route> findByOrderIdAndTenantId(String orderId, String tenantId);
}
