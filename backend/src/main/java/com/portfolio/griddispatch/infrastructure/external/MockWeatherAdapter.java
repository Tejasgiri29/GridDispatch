package com.portfolio.griddispatch.infrastructure.external;

import com.portfolio.griddispatch.application.port.WeatherPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MockWeatherAdapter implements WeatherPort {

    @Override
    public WeatherCondition getCurrentCondition(double latitude, double longitude) {
        log.info("[MockWeather] Querying weather conditions for ({}, {})", latitude, longitude);
        return new WeatherCondition("CLEAR", 12.5, false, 19.5);
    }
}
