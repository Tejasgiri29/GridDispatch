package com.portfolio.griddispatch.api.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ResolveIncidentRequest(
    @NotBlank String resolutionNotes
) {}
