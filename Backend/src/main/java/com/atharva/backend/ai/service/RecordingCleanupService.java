package com.atharva.backend.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Scheduled cleanup service for orphaned recording files.
 * Runs daily to delete recordings older than 24 hours that weren't
 * automatically deleted by the AI pipeline.
 */
@Service
@Slf4j
public class RecordingCleanupService {

    @Value("${recording.output.dir:./recordings}")
    private String recordingDir;

    /**
     * Runs every day at 3:00 AM to clean up old recordings.
     * Cron format: second minute hour day month weekday
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupOldRecordings() {
        log.info("Starting scheduled cleanup of old recordings in: {}", recordingDir);

        Path recordingsPath = Paths.get(recordingDir);
        
        if (!Files.exists(recordingsPath)) {
            log.info("Recordings directory does not exist, skipping cleanup");
            return;
        }

        Instant cutoffTime = Instant.now().minus(24, ChronoUnit.HOURS);
        int deletedCount = 0;
        int errorCount = 0;

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(recordingsPath, "*.{ogg,mp3,wav,m4a}")) {
            for (Path file : stream) {
                try {
                    BasicFileAttributes attrs = Files.readAttributes(file, BasicFileAttributes.class);
                    Instant fileTime = attrs.creationTime().toInstant();

                    if (fileTime.isBefore(cutoffTime)) {
                        Files.delete(file);
                        deletedCount++;
                        log.info("Deleted old recording: {} (created: {})", file.getFileName(), fileTime);
                    }
                } catch (IOException e) {
                    errorCount++;
                    log.error("Failed to delete recording file: {}", file.getFileName(), e);
                }
            }
        } catch (IOException e) {
            log.error("Error during recording cleanup", e);
            return;
        }

        log.info("Cleanup completed — deleted: {}, errors: {}", deletedCount, errorCount);
    }

    /**
     * Manual cleanup method that can be called via API if needed.
     * Deletes all recordings regardless of age.
     */
    public int cleanupAllRecordings() {
        log.warn("Manual cleanup of ALL recordings requested");

        Path recordingsPath = Paths.get(recordingDir);
        
        if (!Files.exists(recordingsPath)) {
            log.info("Recordings directory does not exist");
            return 0;
        }

        int deletedCount = 0;

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(recordingsPath, "*.{ogg,mp3,wav,m4a}")) {
            for (Path file : stream) {
                try {
                    Files.delete(file);
                    deletedCount++;
                    log.info("Deleted recording: {}", file.getFileName());
                } catch (IOException e) {
                    log.error("Failed to delete recording file: {}", file.getFileName(), e);
                }
            }
        } catch (IOException e) {
            log.error("Error during manual cleanup", e);
        }

        log.info("Manual cleanup completed — deleted: {} files", deletedCount);
        return deletedCount;
    }

    /**
     * Get the current disk usage of the recordings directory.
     */
    public long getRecordingsDiskUsage() {
        Path recordingsPath = Paths.get(recordingDir);
        
        if (!Files.exists(recordingsPath)) {
            return 0;
        }

        long totalSize = 0;

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(recordingsPath)) {
            for (Path file : stream) {
                if (Files.isRegularFile(file)) {
                    totalSize += Files.size(file);
                }
            }
        } catch (IOException e) {
            log.error("Error calculating disk usage", e);
        }

        return totalSize;
    }
}
