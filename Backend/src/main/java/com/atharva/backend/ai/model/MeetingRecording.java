package com.atharva.backend.ai.model;


import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "meeting_recordings", uniqueConstraints = @UniqueConstraint(columnNames = "meeting_id"))
public class MeetingRecording {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meeting_id", nullable = false, length = 64)
    private String meetingId;

    @Column(name = "recording_path", nullable = false, columnDefinition = "TEXT")
    private String recordingPath;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getMeetingId() { return meetingId; }
    public void setMeetingId(String meetingId) { this.meetingId = meetingId; }
    public String getRecordingPath() { return recordingPath; }
    public void setRecordingPath(String recordingPath) { this.recordingPath = recordingPath; }
}