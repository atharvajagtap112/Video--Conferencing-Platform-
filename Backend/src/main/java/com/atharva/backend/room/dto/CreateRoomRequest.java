package com.atharva.backend.room.dto;

import lombok.Data;

@Data
public class CreateRoomRequest {
    private String title;
    private int maxParticipants;
}