package com.atharva.backend.sfu;

import com.atharva.backend.sfu.dto.SfuTokenResponse;
import io.livekit.server.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class LiveKitService {

    private final String apiKey;
    private final String apiSecret;
    private final String livekitUrl;

    public LiveKitService(
            @Value("${livekit.api.key}") String apiKey,
            @Value("${livekit.api.secret}") String apiSecret,
            @Value("${livekit.url}") String livekitUrl
    ) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.livekitUrl = livekitUrl;
    }

    /**
     * Generate a LiveKit JWT access token for a participant.
     *
     * @param roomName   The meeting ID (used as the LiveKit room name)
     * @param identity   The username (unique participant identity)
     * @param isHost     If true, grants extra permissions (e.g., room admin)
     * @return SfuTokenResponse containing the token and server URL
     */
    public SfuTokenResponse generateToken(String roomName, String identity, boolean isHost) {
        try {
            AccessToken token = new AccessToken(apiKey, apiSecret);
            token.setName(identity);
            token.setIdentity(identity);

            // Each grant is its own class — pass them all into addGrants()
            if (isHost) {
                token.addGrants(
                        new RoomJoin(true),
                        new RoomName(roomName),
                        new CanPublish(true),
                        new CanSubscribe(true),
                        new RoomAdmin(true)      // Host can mute/kick others
                );
            } else {
                token.addGrants(
                        new RoomJoin(true),
                        new RoomName(roomName),
                        new CanPublish(true),
                        new CanSubscribe(true)
                );
            }

            // TTL is in MILLISECONDS (defaults to 6 hours)
            token.setTtl(TimeUnit.MILLISECONDS.convert(6, TimeUnit.HOURS));

            String jwt = token.toJwt();

            log.info("Generated LiveKit token for {} in room {} (host={})",
                    identity, roomName, isHost);

            return new SfuTokenResponse(jwt, livekitUrl);

        } catch (Exception e) {
            log.error("Failed to generate LiveKit token", e);
            throw new RuntimeException("SFU token generation failed", e);
        }
    }
}