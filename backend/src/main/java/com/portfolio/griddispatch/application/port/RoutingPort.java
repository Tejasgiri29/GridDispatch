package com.portfolio.griddispatch.application.port;

import com.portfolio.griddispatch.domain.valueobject.Coordinates;

public interface RoutingPort {
    record RoutePlan(double distanceKm, int durationMinutes, String polylineGeoJson) {}
    RoutePlan calculateOptimalRoute(Coordinates origin, Coordinates destination, String routingPreference);
}
