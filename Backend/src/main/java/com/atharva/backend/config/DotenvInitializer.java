package com.atharva.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically loads environment variables from .env file.
 * No need to manually set environment variables in IntelliJ IDEA anymore!
 * 
 * This runs BEFORE Spring Boot loads application.properties,
 * so ${VARIABLE} placeholders will work correctly.
 */
@Slf4j
public class DotenvInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment environment = applicationContext.getEnvironment();
        
        File envFile = new File(".env");
        if (!envFile.exists()) {
            log.info("ℹ️ No .env file found (this is OK in production)");
            return;
        }

        try {
            Map<String, Object> envVars = new HashMap<>();
            
            try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    
                    // Skip empty lines and comments
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    
                    // Parse KEY=VALUE
                    int equalsIndex = line.indexOf('=');
                    if (equalsIndex > 0) {
                        String key = line.substring(0, equalsIndex).trim();
                        String value = line.substring(equalsIndex + 1).trim();
                        
                        // Remove quotes if present
                        if (value.startsWith("\"") && value.endsWith("\"")) {
                            value = value.substring(1, value.length() - 1);
                        }
                        
                        envVars.put(key, value);
                        log.debug("Loaded: {} = {}", key, maskSensitive(key, value));
                    }
                }
            }
            
            // Add as property source with high priority
            environment.getPropertySources().addFirst(
                new MapPropertySource("dotenv", envVars)
            );
            
            log.info("✅ Loaded {} environment variables from .env file", envVars.size());
            
        } catch (Exception e) {
            log.error("❌ Failed to load .env file", e);
        }
    }

    /**
     * Mask sensitive values in logs
     */
    private String maskSensitive(String key, String value) {
        String lowerKey = key.toLowerCase();
        if (lowerKey.contains("password") || 
            lowerKey.contains("secret") || 
            lowerKey.contains("key") ||
            lowerKey.contains("token")) {
            return "***" + (value.length() > 4 ? value.substring(value.length() - 4) : "***");
        }
        return value;
    }
}
