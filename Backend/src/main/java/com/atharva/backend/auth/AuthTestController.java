package com.atharva.backend.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Test endpoint to verify JWT authentication is working
 */
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class AuthTestController {

    private final JwtService jwtService;

    @GetMapping("/auth")
    public ResponseEntity<?> testAuth(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        log.info("=== AUTH TEST ENDPOINT CALLED ===");
        log.info("Authorization header: {}", authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("No Bearer token found");
            return ResponseEntity.ok(Map.of(
                    "authenticated", false,
                    "message", "No Bearer token found in Authorization header"
            ));
        }

        String token = authHeader.substring(7);
        log.info("Token extracted: {}...", token.substring(0, Math.min(20, token.length())));

        boolean isValid = jwtService.isTokenValid(token);
        log.info("Token valid: {}", isValid);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("Security context authentication: {}", auth);

        if (isValid && auth != null && auth.isAuthenticated()) {
            Long userId = jwtService.extractUserId(token);
            log.info("User ID from token: {}", userId);
            
            return ResponseEntity.ok(Map.of(
                    "authenticated", true,
                    "userId", userId,
                    "principal", auth.getPrincipal().toString(),
                    "message", "JWT authentication successful"
            ));
        } else {
            return ResponseEntity.ok(Map.of(
                    "authenticated", false,
                    "tokenValid", isValid,
                    "securityContextAuth", auth != null,
                    "message", "JWT authentication failed"
            ));
        }
    }
}
