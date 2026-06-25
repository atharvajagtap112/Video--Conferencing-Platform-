package com.atharva.backend.ai.controller;

import com.atharva.backend.ai.service.RecordingCleanupService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin endpoints for managing recordings.
 * In production, these should be protected with admin-only authentication.
 */
@RestController
@RequestMapping("/api/admin/recordings")
@Slf4j
public class RecordingAdminController {

    private final RecordingCleanupService cleanupService;

    public RecordingAdminController(RecordingCleanupService cleanupService) {
        this.cleanupService = cleanupService;
    }

    /**
     * Manually trigger cleanup of all recordings.
     * WARNING: This deletes ALL recording files regardless of age.
     */
    @PostMapping("/cleanup")
    public ResponseEntity<?> cleanupAllRecordings() {
        log.warn("Manual cleanup triggered via API");
        int deletedCount = cleanupService.cleanupAllRecordings();
        return ResponseEntity.ok(Map.of(
                "message", "Cleanup completed",
                "deletedFiles", deletedCount
        ));
    }

    /**
     * Get current disk usage of recordings directory.
     */
    @GetMapping("/disk-usage")
    public ResponseEntity<?> getDiskUsage() {
        long bytes = cleanupService.getRecordingsDiskUsage();
        double mb = bytes / (1024.0 * 1024.0);
        return ResponseEntity.ok(Map.of(
                "bytes", bytes,
                "megabytes", String.format("%.2f MB", mb)
        ));
    }
}
