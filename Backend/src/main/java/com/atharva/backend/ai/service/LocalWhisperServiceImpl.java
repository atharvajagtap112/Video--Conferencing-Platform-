package com.atharva.backend.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

/**
 * Runs the local faster-whisper Python script to transcribe audio.
 * The whisper.command property is a format string containing %s
 * which is replaced with the audio file path at runtime.
 */
@Service
@Slf4j
public class LocalWhisperServiceImpl implements LocalWhisperService {

    @Value("${whisper.command}")
    private String whisperCommand;

    /** Maximum time to wait for whisper to finish (minutes) */
    private static final int TIMEOUT_MINUTES = 30;

    @Override
    public String transcribe(String audioFilePath) {
        try {
            // Replace %s placeholder with the actual audio file path
            String cmd = String.format(whisperCommand, audioFilePath);
            log.info("Running whisper command: {}", cmd);

            Process p = new ProcessBuilder("cmd", "/c", cmd)
                    .redirectErrorStream(true)
                    .start();

            // Read output in a separate step to avoid deadlock on large outputs
            String output = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            boolean finished = p.waitFor(TIMEOUT_MINUTES, TimeUnit.MINUTES);
            if (!finished) {
                p.destroyForcibly();
                throw new RuntimeException("Whisper process timed out after " + TIMEOUT_MINUTES + " minutes");
            }

            int exitCode = p.exitValue();
            if (exitCode != 0) {
                log.error("Whisper exited with code {} — output: {}", exitCode, output);
                throw new RuntimeException("Whisper process failed (exit=" + exitCode + "): " + output);
            }

            // Check if the script wrote a .txt file alongside the audio
            Path txtFile = Path.of(audioFilePath + ".txt");
            if (Files.exists(txtFile)) {
                String transcript = Files.readString(txtFile).trim();
                log.info("Read transcript from file: {} — {} chars", txtFile, transcript.length());
                return transcript;
            }

            // Otherwise, use stdout (which is what our transcribe.py prints)
            String transcript = output.trim();
            log.info("Got transcript from stdout — {} chars", transcript.length());
            return transcript;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Whisper transcription was interrupted", e);
        } catch (Exception e) {
            log.error("Local whisper transcription error for {}", audioFilePath, e);
            throw new RuntimeException("Local whisper transcription error: " + e.getMessage(), e);
        }
    }
}