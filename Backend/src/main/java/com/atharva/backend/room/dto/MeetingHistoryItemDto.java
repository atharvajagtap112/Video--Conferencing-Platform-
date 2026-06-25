package com.atharva.backend.room.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MeetingHistoryItemDto {
    private String meetingId;
    private String title;
    private String role;
    private String roomStatus;
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
    private LocalDateTime closedAt;
    private String summaryStatus;
}