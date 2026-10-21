package com.portfolio.griddispatch.api.dto.response;

public record AuthResponse(
    String token,
    String tenantId,
    String email,
    String role,
    long expiresInSeconds
) {}
