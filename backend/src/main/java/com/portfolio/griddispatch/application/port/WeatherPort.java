package com.portfolio.griddispatch.application.port;

public interface WeatherPort {
    record WeatherCondition(String condition, double windSpeedKmh, boolean precipitation, double temperatureC) {}
    WeatherCondition getCurrentCondition(double latitude, double longitude);
}
