package com.portfolio.griddispatch.domain.policy;

import com.portfolio.griddispatch.domain.model.Asset;
import com.portfolio.griddispatch.domain.model.Incident;
import com.portfolio.griddispatch.domain.model.TelemetryEvent;
import com.portfolio.griddispatch.domain.valueobject.Coordinates;
import com.portfolio.griddispatch.domain.valueobject.IncidentSeverity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Component
public class AnomalyDetectionEngine {

    public Optional<Incident> evaluateTelemetry(Asset asset, TelemetryEvent currentTelemetry, TelemetryEvent previousTelemetry) {
        String tenantId = asset.getTenantId();

        // Rule 1: Impossible Speed / Teleportation
        if (previousTelemetry != null) {
            Coordinates prevCoords = new Coordinates(previousTelemetry.getLatitude(), previousTelemetry.getLongitude());
            Coordinates currCoords = new Coordinates(currentTelemetry.getLatitude(), currentTelemetry.getLongitude());
            double distKm = prevCoords.distanceToKm(currCoords);
            long secondsElapsed = Math.max(1, Duration.between(previousTelemetry.getTimestamp(), currentTelemetry.getTimestamp()).toSeconds());
            double calculatedSpeedKmh = (distKm / secondsElapsed) * 3600.0;

            if (calculatedSpeedKmh > 160.0) { // Exceeds 160 km/h in urban delivery zone
                return Optional.of(Incident.builder()
                    .id("inc-" + UUID.randomUUID())
                    .tenantId(tenantId)
                    .assetId(asset.getId())
                    .severity(IncidentSeverity.CRITICAL)
                    .ruleName("TELEPORTATION_IMPOSSIBLE_SPEED")
                    .description(String.format("Calculated speed %.1f km/h between telemetry updates is physically implausible for asset %s.", calculatedSpeedKmh, asset.getName()))
                    .status("OPEN")
                    .build());
            }

            // Rule 2: Rapid Battery Drain Anomaly
            double batteryDrop = previousTelemetry.getBatteryPercent().subtract(currentTelemetry.getBatteryPercent()).doubleValue();
            if (batteryDrop > 15.0 && secondsElapsed < 300) { // Lost >15% in under 5 minutes
                return Optional.of(Incident.builder()
                    .id("inc-" + UUID.randomUUID())
                    .tenantId(tenantId)
                    .assetId(asset.getId())
                    .severity(IncidentSeverity.HIGH)
                    .ruleName("RAPID_BATTERY_DRAIN")
                    .description(String.format("Battery dropped by %.1f%% in %d seconds. Possible cell degradation or short circuit.", batteryDrop, secondsElapsed))
                    .status("OPEN")
                    .build());
            }
        }

        // Rule 3: Geofence Breach
        if ("OUTSIDE".equalsIgnoreCase(currentTelemetry.getGeofenceStatus())) {
            return Optional.of(Incident.builder()
                .id("inc-" + UUID.randomUUID())
                .tenantId(tenantId)
                .assetId(asset.getId())
                .severity(IncidentSeverity.MEDIUM)
                .ruleName("GEOFENCE_BREACH")
                .description(String.format("Asset %s breached approved operational perimeter at coordinates (%.4f, %.4f).",
                    asset.getName(), currentTelemetry.getLatitude(), currentTelemetry.getLongitude()))
                .status("OPEN")
                .build());
        }

        // Rule 4: Overheating Warning
        if (currentTelemetry.getMotorTemperatureC() != null && currentTelemetry.getMotorTemperatureC().compareTo(new BigDecimal("85.0")) > 0) {
            return Optional.of(Incident.builder()
                .id("inc-" + UUID.randomUUID())
                .tenantId(tenantId)
                .assetId(asset.getId())
                .severity(IncidentSeverity.HIGH)
                .ruleName("MOTOR_THERMAL_OVERHEAT")
                .description(String.format("Motor temperature at %.1f°C exceeds safety threshold (85°C).", currentTelemetry.getMotorTemperatureC().doubleValue()))
                .status("OPEN")
                .build());
        }

        return Optional.empty();
    }
}
