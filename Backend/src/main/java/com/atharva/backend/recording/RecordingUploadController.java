package com.atharva.backend.recording;

import com.atharva.backend.ai.service.MeetingAiPipelineService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@RestController
@RequestMapping("/api/recordings")
@Slf4j
public class RecordingUploadController {

    @Value("${recording.output.dir}")
    private String outputDir;

    private final MeetingAiPipelineService aiPipelineService;

    public RecordingUploadController(MeetingAiPipelineService aiPipelineService) {
        this.aiPipelineService = aiPipelineService;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadRecording(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("meetingId") String meetingId
    ) {
        try {
            log.info("Received recording upload for meeting {}: {} ({} MB)",
                    meetingId,
                    audioFile.getOriginalFilename(),
                    audioFile.getSize() / 1024.0 / 1024.0);

            Files.createDirectories(Paths.get(outputDir));

            String extension = getFileExtension(audioFile.getOriginalFilename());
            String finalFileName = meetingId + "." + extension;
            Path finalFilePath = Paths.get(outputDir, finalFileName);

            Files.copy(audioFile.getInputStream(), finalFilePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Recording saved: {}", finalFilePath);


            aiPipelineService.run(meetingId, finalFilePath.toString());

            return ResponseEntity.ok("Recording uploaded successfully");
        } catch (IOException e) {
            log.error("Failed to upload recording for meeting {}", meetingId, e);
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }



    private String getFileExtension(String filename) {
        if (filename == null) return "webm";
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0) {
            return filename.substring(dotIndex + 1);
        }
        return "webm";
    }
}
