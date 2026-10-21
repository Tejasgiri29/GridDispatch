package com.portfolio.griddispatch.infrastructure.external;

import com.portfolio.griddispatch.application.port.RoutingPort;
import com.portfolio.griddispatch.domain.valueobject.Coordinates;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MockRoutingAdapter implements RoutingPort {

    @Override
    public RoutePlan calculateOptimalRoute(Coordinates origin, Coordinates destination, String routingPreference) {
        double distKm = origin.distanceToKm(destination);
        int durationMin = (int) Math.ceil((distKm / 30.0) * 60.0);

        String geoJson = String.format("{\"type\":\"LineString\",\"coordinates\":[[%f,%f],[%f,%f]]}",
            origin.longitude(), origin.latitude(), destination.longitude(), destination.latitude());

        log.info("[MockRouting] Route calculated: {} km, {} min (Mode: {})", distKm, durationMin, routingPreference);
        return new RoutePlan(distKm, durationMin, geoJson);
    }
}
