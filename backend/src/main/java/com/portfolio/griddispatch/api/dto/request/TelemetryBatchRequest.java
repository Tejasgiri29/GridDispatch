package com.portfolio.griddispatch.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record TelemetryBatchRequest(
    @NotNull List<TelemetryItem> events
) {
    public record TelemetryItem(
        @NotBlank String assetId,
        double latitude,
        double longitude,
        double speedKmh,
        double headingDegrees,
        double batteryPercent,
        Double motorTemperatureC,
        String geofenceStatus
    ) {}
}
