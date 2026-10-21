package com.portfolio.griddispatch.api.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateOrderRequest(
    String externalOrderId,
    @NotNull double pickupLat,
    @NotNull double pickupLon,
    @NotNull double dropoffLat,
    @NotNull double dropoffLon,
    @NotNull @DecimalMin("0.01") BigDecimal packageWeightKg,
    String priority,
    String carbonPreference,
    boolean autoDispatch
) {}
