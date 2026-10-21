package com.portfolio.griddispatch.application.service;

import com.portfolio.griddispatch.domain.model.EmissionReport;
import com.portfolio.griddispatch.domain.policy.CarbonAccountingEngine;
import com.portfolio.griddispatch.domain.repository.EmissionReportRepository;
import com.portfolio.griddispatch.domain.valueobject.AssetType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CarbonAccountingService {

    private final EmissionReportRepository emissionReportRepository;
    private final CarbonAccountingEngine carbonEngine;

    public record CarbonSummary(BigDecimal totalEmissionsKg, BigDecimal totalDieselBaselineKg, BigDecimal totalSavedKg) {}

    public List<EmissionReport> listReports(String tenantId) {
        return emissionReportRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional
    public EmissionReport recordOrderDelivery(String tenantId, String orderId, String assetId, AssetType assetType, double distanceKm) {
        EmissionReport report = carbonEngine.calculateOrderEmissions(tenantId, orderId, assetId, assetType, distanceKm);
        return emissionReportRepository.save(report);
    }

    public CarbonSummary getTenantSummary(String tenantId) {
        List<EmissionReport> reports = emissionReportRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        BigDecimal totalEmissions = reports.stream().map(EmissionReport::getCalculatedCo2Kg).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDiesel = reports.stream().map(EmissionReport::getDieselBaselineCo2Kg).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSaved = reports.stream().map(EmissionReport::getCo2SavedKg).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CarbonSummary(totalEmissions, totalDiesel, totalSaved);
    }
}
