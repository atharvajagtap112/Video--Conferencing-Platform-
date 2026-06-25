package com.atharva.backend.sfu;

import io.livekit.server.EgressServiceClient;
import livekit.LivekitEgress;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Records meeting audio using LiveKit Egress API.
 *
 * Path coordination:
 *   - The Egress container writes files to /recordings/ (container path).
 *   - Docker volume maps that to ${recording.output.dir} on the host.
 *   - startRecording() tells Egress to write to the CONTAINER path.
 *   - stopAndGetRecordingPath() returns the HOST path for Whisper.
 */
@Service
@Slf4j
public class LiveKitRecordingServiceImpl implements LiveKitRecordingService {

    @Value("${livekit.api.key}")
    private String apiKey;

    @Value("${livekit.api.secret}")
    private String apiSecret;

    @Value("${livekit.url}")
    private String livekitUrl;

    /** Host-side directory where Docker volume mounts /recordings */
    @Value("${recording.output.dir}")
    private String outputDir;

    /** Path inside the Egress Docker container where recordings are written */
    private static final String CONTAINER_RECORDING_DIR = "/recordings";

    /** Active egress ID per meeting */
    private final Map<String, String> egressIds = new ConcurrentHashMap<>();
    /** Output file path (host-side) per meeting */
    private final Map<String, String> outputPaths = new ConcurrentHashMap<>();

    /**
     * Convert ws:// or wss:// URL to http:// or https:// for the Egress REST API.
     * The LiveKit Egress client uses HTTP, not WebSocket.
     */
    private String toHttpUrl(String url) {
        if (url.startsWith("ws://")) {
            return url.replaceFirst("ws://", "http://");
        } else if (url.startsWith("wss://")) {
            return url.replaceFirst("wss://", "https://");
        }
        return url;
    }

    @Override
    public void startRecording(String meetingId) {
        // Idempotency: skip if already recording this meeting
        if (egressIds.containsKey(meetingId)) {
            log.info("Recording already active for meeting {}, skipping", meetingId);
            return;
        }

        try {
            // Ensure the host output directory exists
            Files.createDirectories(Path.of(outputDir));

            // Container path — this is what Egress writes to inside Docker
            String containerFilePath = CONTAINER_RECORDING_DIR + "/" + meetingId + ".ogg";
            // Host path — this is where the file appears on the host via Docker volume
            String hostFilePath = outputDir + "/" + meetingId + ".ogg";

            String httpUrl = toHttpUrl(livekitUrl);
            log.info("Connecting to LiveKit Egress: {} (key={}, secret=***)", httpUrl, apiKey);

            // Create egress client with increased timeout (30 seconds)
            EgressServiceClient egressClient = EgressServiceClient.createClient(
                    httpUrl, apiKey, apiSecret
            );
            // Note: If timeout issues persist, the client library may need custom OkHttpClient configuration

            // Build file output — use the CONTAINER path (Egress runs inside Docker)
            LivekitEgress.EncodedFileOutput fileOutput = LivekitEgress.EncodedFileOutput.newBuilder()
                    .setFileType(LivekitEgress.EncodedFileType.OGG)
                    .setFilepath(containerFilePath)
                    .build();

            log.info("Starting egress recording for meeting {} to {}", meetingId, containerFilePath);

            // Start room composite egress — audio only
            LivekitEgress.EgressInfo egressInfo = egressClient
                    .startRoomCompositeEgress(
                            meetingId,         // roomName
                            fileOutput,        // output
                            "",                // layout (default)
                            null,              // preset (none)
                            null,              // advancedEncoding (none)
                            true,              // audioOnly
                            false,             // videoOnly
                            ""                 // customBaseUrl
                    )
                    .execute()
                    .body();

            if (egressInfo != null) {
                String egressId = egressInfo.getEgressId();
                egressIds.put(meetingId, egressId);
                outputPaths.put(meetingId, hostFilePath);
                log.info("Started egress recording for meeting {} — egressId={}, containerPath={}, hostPath={}",
                        meetingId, egressId, containerFilePath, hostFilePath);
            } else {
                throw new RuntimeException("Egress start returned null response body");
            }
        } catch (Exception e) {
            log.error("Failed to start recording for meeting {}", meetingId, e);
            log.warn("⚠️ LiveKit Egress (recording) is not available.");
            log.warn("⚠️ AI summary feature will not work without recordings.");
            log.warn("⚠️ Check: 1) Docker containers running 2) API_SECRET matches 3) LiveKit server reachable");
            // Don't throw - let the meeting continue without recording
        }
    }

    @Override
    public String stopAndGetRecordingPath(String meetingId) {
        String egressId = egressIds.remove(meetingId);
        String outputPath = outputPaths.remove(meetingId);

        if (egressId == null) {
            log.warn("No active egress found for meeting {}", meetingId);
            return outputPath != null ? outputPath : outputDir + "/" + meetingId + ".ogg";
        }

        try {
            EgressServiceClient egressClient = EgressServiceClient.createClient(
                    toHttpUrl(livekitUrl), apiKey, apiSecret
            );

            egressClient
                    .stopEgress(egressId)
                    .execute();

            log.info("Stopped egress recording for meeting {} — egressId={}", meetingId, egressId);
        } catch (IOException e) {
            log.error("Error stopping egress for meeting {}", meetingId, e);
        }

        // Wait for Egress to flush the file to disk via the Docker volume
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        if (outputPath == null) {
            outputPath = outputDir + "/" + meetingId + ".ogg";
        }
        log.info("Recording file for meeting {}: {}", meetingId, outputPath);
        return outputPath;
    }
}