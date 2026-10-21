package com.portfolio.griddispatch.infrastructure.external;

import com.portfolio.griddispatch.application.port.EnergyGridForecastPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MockGridCarbonForecastAdapter implements EnergyGridForecastPort {

    @Override
    public GridCarbonForecast getForecastForLocation(double latitude, double longitude) {
        log.info("[MockEnergyGrid] Fetching regional marginal emission factor for ({}, {})", latitude, longitude);
        // Clean solar/wind daytime window in California: ~65 g CO2/kWh, $0.14/kWh
        return new GridCarbonForecast(65.0, 0.14, true);
    }
}
