package com.atharva.backend.ai.service;

import com.atharva.backend.ai.model.*;
import com.atharva.backend.ai.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Orchestrates the full AI pipeline: transcription → summarization.
 * Runs asynchronously so the HTTP request (closeRoom) returns immediately.
 */
@Service
@Slf4j
public class MeetingAiPipelineService {

    private final MeetingTranscriptRepository transcriptRepo;
    private final MeetingSummaryRepository summaryRepo;
    private final LocalWhisperService whisper;
    private final GeminiSummaryService gemini;

    public MeetingAiPipelineService(
            MeetingTranscriptRepository transcriptRepo,
            MeetingSummaryRepository summaryRepo,
            LocalWhisperService whisper,
            GeminiSummaryService gemini
    ) {
        this.transcriptRepo = transcriptRepo;
        this.summaryRepo = summaryRepo;
        this.whisper = whisper;
        this.gemini = gemini;
    }

    @Async
    public void run(String meetingId, String audioFilePath) {
        log.info("AI pipeline started for meeting {} — audio: {}", meetingId, audioFilePath);

        // Check if recording file exists
        if (!java.nio.file.Files.exists(java.nio.file.Paths.get(audioFilePath))) {
            log.error("❌ Recording file not found: {}", audioFilePath);
            log.error("❌ This usually means LiveKit Egress (recording) is not available.");
            log.error("❌ LiveKit Cloud free tier does not support recording.");
            log.error("❌ To enable AI summaries: Use self-hosted LiveKit or upgrade to paid plan.");
            
            // Mark as failed with helpful message
            MeetingSummary sm = summaryRepo.findByMeetingId(meetingId)
                    .orElseGet(() -> {
                        var x = new MeetingSummary();
                        x.setMeetingId(meetingId);
                        return x;
                    });
            sm.setStatus(JobStatus.FAILED);
            sm.setErrorMessage("Recording not available. LiveKit Cloud free tier does not support recording. Use self-hosted LiveKit or upgrade to enable AI summaries.");
            summaryRepo.save(sm);
            return;
        }

        // Get or create transcript/summary rows
        MeetingTranscript tr = transcriptRepo.findByMeetingId(meetingId)
                .orElseGet(() -> {
                    var x = new MeetingTranscript();
                    x.setMeetingId(meetingId);
                    return x;
                });
        MeetingSummary sm = summaryRepo.findByMeetingId(meetingId)
                .orElseGet(() -> {
                    var x = new MeetingSummary();
                    x.setMeetingId(meetingId);
                    return x;
                });

        // Idempotency: skip if already in-progress or completed
        if (sm.getStatus() == JobStatus.PROCESSING || sm.getStatus() == JobStatus.COMPLETED) {
            log.info("Pipeline already {} for meeting {} — skipping", sm.getStatus(), meetingId);
            return;
        }

        try {
            // ── Step 1: Transcribe ──
            tr.setStatus(JobStatus.PROCESSING);
            tr = transcriptRepo.save(tr);
            
            sm.setStatus(JobStatus.PROCESSING);
            sm = summaryRepo.save(sm);

            log.info("Transcribing audio for meeting {}...", meetingId);
            String transcript = whisper.transcribe(audioFilePath);

            if (transcript == null || transcript.isBlank()) {
                throw new RuntimeException("Whisper returned empty transcript");
            }

            tr.setTranscriptText(transcript);
            tr.setStatus(JobStatus.COMPLETED);
            transcriptRepo.save(tr);
            log.info("Transcription completed for meeting {} — {} chars", meetingId, transcript.length());

            // ── Step 2: Summarize ──
            log.info("Summarizing transcript for meeting {}...", meetingId);
            String summaryJson = gemini.summarizeJson(transcript);

            sm.setSummaryJson(summaryJson);
            sm.setModel("gemini");
            sm.setStatus(JobStatus.COMPLETED);
            summaryRepo.save(sm);
            log.info("Summary completed for meeting {}", meetingId);

            // ── Step 3: Delete recording file ──
            deleteRecordingFile(audioFilePath);

        } catch (Exception e) {
            String err = e.getClass().getSimpleName() + ": " +
                    (e.getMessage() == null ? "Unknown error" : e.getMessage());
            if (err.length() > 500) err = err.substring(0, 500);

            log.error("AI pipeline failed for meeting {}: {}", meetingId, err, e);

            tr.setStatus(JobStatus.FAILED);
            tr.setErrorMessage(err);
            transcriptRepo.save(tr);

            sm.setStatus(JobStatus.FAILED);
            sm.setErrorMessage(err);
            summaryRepo.save(sm);

            // ── Delete recording even on failure to save space ──
            deleteRecordingFile(audioFilePath);
        }
    }

    /**
     * Deletes the recording file after processing to save disk space.
     * Safe to call even if file doesn't exist.
     */
    private void deleteRecordingFile(String audioFilePath) {
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(audioFilePath);
            if (java.nio.file.Files.exists(path)) {
                java.nio.file.Files.delete(path);
                log.info("Deleted recording file: {}", audioFilePath);
            } else {
                log.warn("Recording file not found for deletion: {}", audioFilePath);
            }
        } catch (Exception e) {
            log.error("Failed to delete recording file: {} — {}", audioFilePath, e.getMessage());
            // Don't throw — deletion failure shouldn't break the pipeline
        }
    }
}