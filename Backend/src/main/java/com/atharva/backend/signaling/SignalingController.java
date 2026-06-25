package com.atharva.backend.signaling;



import com.atharva.backend.signaling.dto.SignalMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Main signaling endpoint.
     * Client sends to: /app/signal
     *
     * Routing logic:
     *  - If targetUsername is set → send only to that user (private)
     *  - If targetUsername is null → broadcast to the room
     */
    @MessageMapping("/signal")
    public void handleSignal(SignalMessage message) {
        String meetingId = message.getMeetingId();
        String target = message.getTargetUsername();

        log.debug("Signal [{}] from {} in room {} → target: {}",
                message.getType(), message.getSenderUsername(),
                meetingId, target != null ? target : "BROADCAST");

        if (target != null && !target.isEmpty()) {
            // --- PRIVATE message (e.g., SDP offer to a specific peer) ---
            // Deliver to /queue/signal-{username}
            messagingTemplate.convertAndSendToUser(
                    target,
                    "/queue/signal",
                    message
            );
        } else {
            // --- BROADCAST to the room ---
            // All subscribers of /topic/room-{meetingId} receive this
            messagingTemplate.convertAndSend(
                    "/topic/room-" + meetingId,
                    message
            );
        }
    }

    /**
     * Dedicated endpoint for SDP exchange (Offer/Answer).
     * Client sends to: /app/room/{meetingId}/sdp
     * This is only needed if you're doing P2P fallback without SFU.
     */
    @MessageMapping("/room/{meetingId}/sdp")
    public void handleSdp(
            @DestinationVariable String meetingId,
            SignalMessage message
    ) {
        message.setMeetingId(meetingId);

        if (message.getTargetUsername() == null) {
            log.warn("SDP message without target user — dropping.");
            return;
        }

        messagingTemplate.convertAndSendToUser(
                message.getTargetUsername(),
                "/queue/signal",
                message
        );
    }
}