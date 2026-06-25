package com.atharva.backend.signaling;


import com.atharva.backend.repository.MeetingRoomRepository;
import com.atharva.backend.repository.ParticipantRepository;
import com.atharva.backend.repository.UserRepository;
import com.atharva.backend.room.RoomService;
import com.atharva.backend.signaling.dto.SignalMessage;
import com.atharva.backend.signaling.dto.SignalType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final MeetingRoomRepository roomRepository;
    private final UserRepository userRepository;
    private final ParticipantRepository participantRepository;
    private final RoomService roomService;

    /**
     * In-memory map: sessionId → { username, meetingId }
     * In production, use Redis for multi-instance support.
     */
    private final Map<String, SessionInfo> activeSessions = new ConcurrentHashMap<>();

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        // Client should send custom headers: "username" and "meetingId"
        String username = accessor.getFirstNativeHeader("username");
        String meetingId = accessor.getFirstNativeHeader("meetingId");

        if (username != null && meetingId != null) {
            activeSessions.put(sessionId, new SessionInfo(username, meetingId));

            roomRepository.findByMeetingId(meetingId).ifPresent(room -> {
                userRepository.findByUsername(username).ifPresent(user -> {
                    participantRepository
                            .findByMeetingRoomAndUserAndLeftAtIsNull(room, user)
                            .ifPresent(participant -> {
                                participant.setSessionId(sessionId);
                                participantRepository.save(participant);
                                log.info("Linked WS session {} to participant {} in room {}",
                                        sessionId, username, meetingId);
                            });
                });
            });

            log.info("WS connected: {} (session={}) → room {}",
                    username, sessionId, meetingId);

            // Broadcast USER_JOINED to the room
            SignalMessage joinMsg = new SignalMessage();
            joinMsg.setType(SignalType.USER_JOINED);
            joinMsg.setMeetingId(meetingId);
            joinMsg.setSenderUsername(username);
            messagingTemplate.convertAndSend(
                    "/topic/room-" + meetingId, joinMsg
            );
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        SessionInfo info = activeSessions.remove(sessionId);
        if (info != null) {
            log.info("WS disconnected: {} (session={}) ← room {}",
                    info.username, sessionId, info.meetingId);
            userRepository.findByUsername(info.username()).ifPresent(user -> {
                roomService.leaveRoom(user, info.meetingId());
            });

            SignalMessage leaveMsg = new SignalMessage();
            leaveMsg.setType(SignalType.USER_LEFT);
            leaveMsg.setMeetingId(info.meetingId);
            leaveMsg.setSenderUsername(info.username);
            messagingTemplate.convertAndSend(
                    "/topic/room-" + info.meetingId, leaveMsg
            );
        }
    }

    private record SessionInfo(String username, String meetingId) {}
}