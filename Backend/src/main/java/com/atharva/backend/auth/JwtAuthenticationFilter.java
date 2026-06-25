package com.atharva.backend.auth;

import com.atharva.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        String requestUri = request.getRequestURI();

        // No token → let the request continue (will be denied by SecurityConfig if protected)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("No JWT token found for request: {}", requestUri);
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (jwtService.isTokenValid(token)) {
                Long userId = jwtService.extractUserId(token);
                userRepository.findById(userId).ifPresentOrElse(
                    user -> {
                        var authToken = new UsernamePasswordAuthenticationToken(
                                user, null, List.of() // Add roles/authorities here if needed
                        );
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        log.debug("JWT authentication successful for user: {} on {}", user.getUsername(), requestUri);
                    },
                    () -> log.warn("User not found for userId: {} from valid JWT token", userId)
                );
            } else {
                log.warn("Invalid JWT token for request: {}", requestUri);
            }
        } catch (Exception e) {
            log.error("JWT authentication failed for request: {} - {}", requestUri, e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
}
