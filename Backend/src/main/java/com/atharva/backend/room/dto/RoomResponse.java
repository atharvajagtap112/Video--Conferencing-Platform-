package com.atharva.backend.room.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
public class RoomResponse {
    private String meetingId;
    private String title;
    private String status;
    private int maxParticipants;
    private LocalDateTime expiresAt;
}
