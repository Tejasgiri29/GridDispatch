package com.portfolio.griddispatch.api.rest;

import com.portfolio.griddispatch.api.dto.request.LoginRequest;
import com.portfolio.griddispatch.api.dto.response.AuthResponse;
import com.portfolio.griddispatch.infrastructure.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "OAuth2 / JWT Token Issuer for operators and fleet managers")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    @Operation(summary = "Authenticate and receive scoped JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        String tenantId = (request.tenantId() != null && !request.tenantId().isBlank())
            ? request.tenantId()
            : "tenant-logistics-us";

        String role = "OPERATOR";
        if (request.email().contains("fleet")) {
            role = "FLEET_MANAGER";
        } else if (request.email().contains("admin")) {
            role = "ADMIN";
        }

        String token = jwtTokenProvider.generateToken(request.email(), tenantId, role);
        return ResponseEntity.ok(new AuthResponse(token, tenantId, request.email(), role, 86400));
    }
}
