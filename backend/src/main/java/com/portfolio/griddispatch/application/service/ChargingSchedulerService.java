package com.portfolio.griddispatch.application.service;

import com.portfolio.griddispatch.application.port.EnergyGridForecastPort;
import com.portfolio.griddispatch.domain.model.Asset;
import com.portfolio.griddispatch.domain.model.ChargingSchedule;
import com.portfolio.griddispatch.domain.model.ChargingStation;
import com.portfolio.griddispatch.domain.repository.AssetRepository;
import com.portfolio.griddispatch.domain.repository.ChargingScheduleRepository;
import com.portfolio.griddispatch.domain.repository.ChargingStationRepository;
import com.portfolio.griddispatch.domain.valueobject.AssetStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChargingSchedulerService {

    private final ChargingScheduleRepository scheduleRepository;
    private final ChargingStationRepository stationRepository;
    private final AssetRepository assetRepository;
    private final EnergyGridForecastPort energyForecastPort;

    public List<ChargingSchedule> listSchedules(String tenantId) {
        return scheduleRepository.findByTenantId(tenantId);
    }

    public List<ChargingStation> listStations(String tenantId) {
        return stationRepository.findByTenantId(tenantId);
    }

    @Transactional
    public ChargingSchedule scheduleOptimalCharge(String tenantId, String assetId, String stationId) {
        Asset asset = assetRepository.findByIdAndTenantId(assetId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + assetId));
        ChargingStation station = stationRepository.findById(stationId)
            .orElseThrow(() -> new IllegalArgumentException("Charging station not found: " + stationId));

        EnergyGridForecastPort.GridCarbonForecast forecast = energyForecastPort.getForecastForLocation(station.getLatitude(), station.getLongitude());

        Instant start = Instant.now();
        Instant end = start.plus(45, ChronoUnit.MINUTES);

        double kwhNeeded = (100.0 - asset.getBatteryPercent().doubleValue()) * 0.6; // ~60kWh pack
        BigDecimal cost = BigDecimal.valueOf(kwhNeeded * forecast.spotPriceUsdPerKwh()).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal carbon = BigDecimal.valueOf(kwhNeeded * (forecast.co2GramsPerKwh() / 1000.0)).setScale(3, java.math.RoundingMode.HALF_UP);

        ChargingSchedule schedule = ChargingSchedule.builder()
            .id("csch-" + UUID.randomUUID())
            .tenantId(tenantId)
            .assetId(asset.getId())
            .stationId(station.getId())
            .startTime(start)
            .endTime(end)
            .targetBatteryPercent(new BigDecimal("95.00"))
            .estimatedCostUsd(cost)
            .estimatedCarbonKg(carbon)
            .status("SCHEDULED")
            .build();

        asset.setStatus(AssetStatus.CHARGING);
        assetRepository.save(asset);

        log.info("Scheduled carbon-optimized charging session for asset {} at station {}. Forecast carbon: {} kg",
            asset.getId(), station.getName(), carbon);

        return scheduleRepository.save(schedule);
    }
}
