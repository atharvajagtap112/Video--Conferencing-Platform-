package com.atharva.backend.ai.model;


import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "meeting_transcripts", uniqueConstraints = @UniqueConstraint(columnNames = "meeting_id"))
public class MeetingTranscript {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name="meeting_id", nullable=false, length=64) private String meetingId;
    @Lob @Column(name="transcript_text", columnDefinition="LONGTEXT") private String transcriptText;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=32) private JobStatus status = JobStatus.PENDING;
    @Column(name="error_message", length=1000) private String errorMessage;
    @Column(name="created_at", nullable=false, updatable=false) private Instant createdAt = Instant.now();

    public String getMeetingId(){return meetingId;} public void setMeetingId(String v){meetingId=v;}
    public String getTranscriptText(){return transcriptText;} public void setTranscriptText(String v){transcriptText=v;}
    public JobStatus getStatus(){return status;} public void setStatus(JobStatus v){status=v;}
    public String getErrorMessage(){return errorMessage;} public void setErrorMessage(String v){errorMessage=v;}
}