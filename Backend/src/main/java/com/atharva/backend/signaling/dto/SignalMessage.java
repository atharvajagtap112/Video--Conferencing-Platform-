package com.atharva.backend.signaling.dto;

import lombok.Data;

@Data
public class SignalMessage {
    private SignalType type;
    private String meetingId;
    private String senderUsername;
    private String targetUsername; // null = broadcast to room
    private Object payload;       // SDP, ICE candidate, chat text, etc.
}