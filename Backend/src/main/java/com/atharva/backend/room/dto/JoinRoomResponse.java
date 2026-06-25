package com.atharva.backend.room.dto;
import lombok.*;

@Data @Builder
public class JoinRoomResponse {
    private String meetingId;
    private String sfuToken;   // LiveKit access token
    private String sfuUrl;     // LiveKit server URL
    private String role;
    private int participantCount;
}