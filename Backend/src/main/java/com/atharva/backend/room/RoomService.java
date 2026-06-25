package com.atharva.backend.room;


import com.atharva.backend.ai.repository.MeetingSummaryRepository;
import com.atharva.backend.ai.service.MeetingAiPipelineService;
import com.atharva.backend.auth.entity.User;
import com.atharva.backend.repository.MeetingRoomRepository;
import com.atharva.backend.repository.ParticipantRepository;
import com.atharva.backend.room.dto.CreateRoomRequest;
import com.atharva.backend.room.dto.JoinRoomResponse;
import com.atharva.backend.room.dto.MeetingHistoryItemDto;
import com.atharva.backend.room.dto.RoomResponse;
import com.atharva.backend.room.entity.MeetingRoom;
import com.atharva.backend.room.entity.Participant;
import com.atharva.backend.room.entity.ParticipantRole;
import com.atharva.backend.room.entity.RoomStatus;
import com.atharva.backend.sfu.LiveKitRecordingService;
import com.atharva.backend.sfu.LiveKitService;
import com.atharva.backend.sfu.dto.SfuTokenResponse;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RoomService {

    private static final int DEFAULT_MAX_PARTICIPANTS = 100;
    private static final int ROOM_LIFETIME_HOURS = 4;

    private final MeetingRoomRepository roomRepository;
    private final ParticipantRepository participantRepository;
    private final LiveKitService liveKitService;
    private final MeetingAiPipelineService meetingAiPipelineService;
    private final LiveKitRecordingService liveKitRecordingService;
    private final MeetingSummaryRepository meetingSummaryRepository;
    
    public RoomService(MeetingRoomRepository roomRepository, ParticipantRepository participantRepository, LiveKitService liveKitService, MeetingAiPipelineService meetingAiPipelineService, LiveKitRecordingService liveKitRecordingService, MeetingSummaryRepository meetingSummaryRepository) {
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
        this.liveKitService = liveKitService;
        this.meetingAiPipelineService = meetingAiPipelineService;
        this.liveKitRecordingService = liveKitRecordingService;
        this.meetingSummaryRepository = meetingSummaryRepository;
    }

    /**
     * Recording is handled by browser-side MediaRecorder.
     * Server-side LiveKit egress is disabled due to configuration complexity.
     */
    private void startRecordingAsync(String meetingId) {
        log.info("Recording for meeting {} will be handled by browser upload", meetingId);
    }

    /**
     * Generate a Zoom-style meeting ID: "abc-defg-hij"
     */
    private String generateMeetingId() {
        String raw = UUID.randomUUID().toString().replace("-", "");
        // Take 10 chars, format as xxx-xxxx-xxx
        String segment = raw.substring(0, 10);
        return segment.substring(0, 3) + "-" +
                segment.substring(3, 7) + "-" +
                segment.substring(7, 10);
    }


    /**
     * Create a new meeting room. The authenticated user becomes HOST.
     */
    @Transactional
    public RoomResponse createRoom(User host, CreateRoomRequest req) {
        String meetingId = generateMeetingId();

        // Ensure uniqueness (extremely unlikely collision, but be safe)
        while (roomRepository.existsByMeetingId(meetingId)) {
            meetingId = generateMeetingId();
        }

        MeetingRoom room = MeetingRoom.builder()
                .meetingId(meetingId)
                .title(req.getTitle() != null ? req.getTitle() : "Meeting")
                .host(host)
                .status(RoomStatus.ACTIVE)
                .maxParticipants(
                        req.getMaxParticipants() > 0
                                ? req.getMaxParticipants()
                                : DEFAULT_MAX_PARTICIPANTS
                )
                .currentParticipantCount(0)
                .expiresAt(LocalDateTime.now().plusHours(ROOM_LIFETIME_HOURS))
                .build();
        roomRepository.save(room);


        log.info("Room created: {} by user {}", meetingId, host.getUsername());

        return RoomResponse.builder()
                .meetingId(meetingId)
                .title(room.getTitle())
                .status(room.getStatus().name())
                .maxParticipants(room.getMaxParticipants())
                .expiresAt(room.getExpiresAt())
                .build();
    }

    /**
     * Join an existing room. Validates:
     *  1. Room exists
     *  2. Room is ACTIVE (not expired/closed)
     *  3. Participant cap not exceeded
     *
     * Then requests a LiveKit token from the SFU and returns it.
     */
    @Transactional
    @Retryable(
            value = CannotAcquireLockException.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 200, multiplier = 2)
    )
    public JoinRoomResponse joinRoom(User user, String meetingId) {
        MeetingRoom room = roomRepository.findByMeetingIdForUpdate(meetingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Room not found: " + meetingId
                ));

        // --- Expiry check ---
        if (room.getStatus() == RoomStatus.EXPIRED ||
                room.getStatus() == RoomStatus.CLOSED) {
            throw new IllegalStateException("This meeting has ended.");
        }
        if (room.getExpiresAt().isBefore(LocalDateTime.now())) {
            room.setStatus(RoomStatus.EXPIRED);
            roomRepository.save(room);
            throw new IllegalStateException("This meeting has expired.");
        }

        // --- Participant cap ---
        if (room.getCurrentParticipantCount() >= room.getMaxParticipants()) {
            throw new IllegalStateException(
                    "Meeting is full (" + room.getMaxParticipants() + " participants max)."
            );
        }

        // --- Determine role ---
        ParticipantRole role = room.getHost().getId().equals(user.getId())
                ? ParticipantRole.HOST
                : ParticipantRole.GUEST;

       // Idempotent: only transition to RUNNING when host first joins
       if (role == ParticipantRole.HOST && room.getStatus() == RoomStatus.ACTIVE) {
           room.setStatus(RoomStatus.RUNNING);
           // Start recording asynchronously after a delay (give LiveKit time to create the room)
           startRecordingAsync(meetingId);
           log.info("Room {} transitioned to RUNNING status, recording will start shortly", meetingId);
       }


        // --- Record participation ---


      Participant participant=    participantRepository.findByMeetingRoomAndUser(room,user).orElseGet(()-> {
                  Participant newParticipant = Participant.builder()
                          .meetingRoom(room)
                          .user(user)
                          .role(role)
                          .build();
               return    participantRepository.save(newParticipant);
              }
         );



        room.setCurrentParticipantCount(room.getCurrentParticipantCount() + 1);
        roomRepository.save(room);

        // --- Get SFU token ---
        SfuTokenResponse sfuToken;
        try {
            sfuToken = liveKitService.generateToken(
                    meetingId,
                    user.getUsername(),
                    role == ParticipantRole.HOST
            );
        } catch (Exception e) {
            // Rollback the participant count on SFU failure
            room.setCurrentParticipantCount(room.getCurrentParticipantCount() - 1);
            roomRepository.save(room);
            participantRepository.delete(participant);

            log.error("Failed to generate SFU token for user {} in room {}",
                    user.getUsername(), meetingId, e);
            throw new RuntimeException(
                    "Could not connect to media server. Please try again.", e
            );
        }

        log.info("User {} joined room {} as {}", user.getUsername(), meetingId, role);

        return JoinRoomResponse.builder()
                .meetingId(meetingId)
                .sfuToken(sfuToken.getToken())
                .sfuUrl(sfuToken.getUrl())
                .role(role.name())
                .participantCount(room.getCurrentParticipantCount())
                .build();
    }

    /**
     * Called when a user disconnects (WebSocket close or explicit leave).
     */
    @Transactional
    public void leaveRoom(User user, String meetingId) {
        MeetingRoom room = roomRepository.findByMeetingId(meetingId).orElse(null);
        if (room == null) return;

        participantRepository
                .findByMeetingRoomAndUser(room, user)
                .ifPresent(p -> {
                    p.setLeftAt(LocalDateTime.now());
                    participantRepository.save(p);

                    room.setCurrentParticipantCount(
                            Math.max(0, room.getCurrentParticipantCount() - 1)
                    );
                    roomRepository.save(room);

                    log.info("User {} left room {}", user.getUsername(), meetingId);
                });
    }

    /**
     * Host closes the room for everyone.
     */
    @Transactional
    public void closeRoom(User host, String meetingId) {
        MeetingRoom room = roomRepository.findByMeetingId(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        if (!room.getHost().getId().equals(host.getId())) {
            throw new SecurityException("Only the host can close this room.");
        }

        room.setStatus(RoomStatus.CLOSED);
        room.setClosedAt(LocalDateTime.now());
        roomRepository.save(room);

        // Browser-side recording: AI pipeline is triggered by upload, not by room close
        log.info("Room closed, AI pipeline will be triggered by recording upload");

        // Mark all active participants as left
        participantRepository.markAllAsLeft(room.getId(), LocalDateTime.now());

        log.info("Room {} closed by host {}", meetingId, host.getUsername());
    }


    @Transactional
    public List<MeetingHistoryItemDto> getMeetingHistory(User user) {
        return participantRepository.findHistoryByUserId(user.getId())
                .stream()
                .map(p -> {
                    String meetingId = p.getMeetingRoom().getMeetingId();
                    String summaryStatus = meetingSummaryRepository.findByMeetingId(meetingId)
                            .map(s -> s.getStatus().name())
                            .orElse("NOT_AVAILABLE");

                    return MeetingHistoryItemDto.builder()
                            .meetingId(meetingId)
                            .title(p.getMeetingRoom().getTitle())
                            .role(p.getRole().name())
                            .roomStatus(p.getMeetingRoom().getStatus().name())
                            .joinedAt(p.getJoinedAt())
                            .leftAt(p.getLeftAt())
                            .closedAt(p.getMeetingRoom().getClosedAt())
                            .summaryStatus(summaryStatus)
                            .build();
                })
                .collect(Collectors.toList());
    }
}