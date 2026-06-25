package com.atharva.backend.ai.model;


import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "meeting_summaries", uniqueConstraints = @UniqueConstraint(columnNames = "meeting_id"))
public class MeetingSummary {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name="meeting_id", nullable=false, length=64) private String meetingId;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=32) private JobStatus status = JobStatus.PENDING;
    @Lob @Column(name="summary_json", columnDefinition="LONGTEXT") private String summaryJson;
    @Column(length=128) private String model;
    @Column(name="error_message", length=1000) private String errorMessage;
    @Column(name="created_at", nullable=false, updatable=false) private Instant createdAt = Instant.now();

    public String getMeetingId(){return meetingId;} public void setMeetingId(String v){meetingId=v;}
    public JobStatus getStatus(){return status;} public void setStatus(JobStatus v){status=v;}
    public String getSummaryJson(){return summaryJson;} public void setSummaryJson(String v){summaryJson=v;}
    public String getModel(){return model;} public void setModel(String v){model=v;}
    public String getErrorMessage(){return errorMessage;} public void setErrorMessage(String v){errorMessage=v;}
}