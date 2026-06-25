package com.atharva.backend.auth;

import com.atharva.backend.auth.dto.*;
import com.atharva.backend.auth.dto.AuthResponse;
import com.atharva.backend.auth.dto.LoginRequest;
import com.atharva.backend.auth.dto.SignupRequest;
import jakarta.servlet.ServletOutputStream;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest req) {
        return ResponseEntity.ok(authService.signup(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        System.out.println(req.getUsername());
        return ResponseEntity.ok(authService.login(req));
    }
}