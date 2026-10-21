package com.portfolio.griddispatch.application.port;

public interface EnergyGridForecastPort {
    record GridCarbonForecast(double co2GramsPerKwh, double spotPriceUsdPerKwh, boolean isCleanWindow) {}
    GridCarbonForecast getForecastForLocation(double latitude, double longitude);
}
