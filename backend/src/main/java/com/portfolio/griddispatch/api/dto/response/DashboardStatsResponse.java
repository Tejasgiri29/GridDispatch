package com.portfolio.griddispatch.api.dto.response;

import java.math.BigDecimal;

public record DashboardStatsResponse(
    long activeOrders,
    long availableAssets,
    long activeIncidents,
    BigDecimal totalCarbonSavedKg,
    double averageBatteryPercent,
    long activeChargingSessions
) {}
