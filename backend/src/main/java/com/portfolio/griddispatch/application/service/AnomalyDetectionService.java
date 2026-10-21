package com.portfolio.griddispatch.application.service;

import com.portfolio.griddispatch.domain.model.Incident;
import com.portfolio.griddispatch.domain.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnomalyDetectionService {

    private final IncidentRepository incidentRepository;

    public List<Incident> listIncidents(String tenantId) {
        return incidentRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional
    public Incident acknowledgeIncident(String tenantId, String incidentId) {
        Incident incident = incidentRepository.findByIdAndTenantId(incidentId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));
        incident.setStatus("ACKNOWLEDGED");
        return incidentRepository.save(incident);
    }

    @Transactional
    public Incident resolveIncident(String tenantId, String incidentId, String resolutionNotes) {
        Incident incident = incidentRepository.findByIdAndTenantId(incidentId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));
        incident.setStatus("RESOLVED");
        incident.setResolutionNotes(resolutionNotes);
        incident.setResolvedAt(Instant.now());
        return incidentRepository.save(incident);
    }
}
