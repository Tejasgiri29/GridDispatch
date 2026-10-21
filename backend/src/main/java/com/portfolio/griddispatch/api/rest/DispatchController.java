package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.application.service.DispatchService;
import com.portfolio.griddispatch.config.TenantContext;
import com.portfolio.griddispatch.domain.model.DispatchAssignment;
import com.portfolio.griddispatch.domain.repository.DispatchAssignmentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dispatch")
@RequiredArgsConstructor
@Tag(name = "Dispatch Engine", description = "Multi-objective Pareto-optimal fleet assignment and re-routing")
public class DispatchController {

    private final DispatchService dispatchService;
    private final DispatchAssignmentRepository assignmentRepository;

    @PostMapping("/assign/{orderId}")
    @Operation(summary = "Calculate and execute Pareto-optimal dispatch assignment for order")
    public ResponseEntity<DispatchAssignment> assignOrder(@PathVariable String orderId) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(dispatchService.dispatchOrder(tenantId, orderId));
    }

    @GetMapping("/assignments")
    @Operation(summary = "List all active dispatch assignments")
    public ResponseEntity<List<DispatchAssignment>> listAssignments() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(assignmentRepository.findByTenantId(tenantId));
    }
}
