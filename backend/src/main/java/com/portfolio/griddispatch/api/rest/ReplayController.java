package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.application.service.DigitalTwinReplayService;
import com.portfolio.griddispatch.config.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/v1/replay")
@RequiredArgsConstructor
@Tag(name = "Digital Twin Replay", description = "Historical fleet state reconstruction and simulation playback")
public class ReplayController {

    private final DigitalTwinReplayService replayService;

    @GetMapping
    @Operation(summary = "Query historical telemetry frames for digital twin time slider")
    public ResponseEntity<List<DigitalTwinReplayService.ReplayFrame>> getReplay(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        String tenantId = TenantContext.getTenantId();
        Instant end = (to != null) ? to : Instant.now();
        Instant start = (from != null) ? from : end.minus(2, ChronoUnit.HOURS);
        return ResponseEntity.ok(replayService.getReplayFrames(tenantId, start, end));
    }
}
