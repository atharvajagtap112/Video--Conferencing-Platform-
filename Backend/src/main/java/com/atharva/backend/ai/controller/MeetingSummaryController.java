package com.atharva.backend.ai.controller;

import com.atharva.backend.ai.repository.MeetingSummaryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/meetings/{meetingId}/summary")
public class MeetingSummaryController {


    private final MeetingSummaryRepository repo;

    public MeetingSummaryController(MeetingSummaryRepository repo) {
        this.repo = repo;
    }
    @GetMapping("/status")
    public ResponseEntity<Status> status(@PathVariable String meetingId){
        var row = repo.findByMeetingId(meetingId).orElse(null);
        if(row==null) return ResponseEntity.ok(new Status("PENDING","Not started"));
        return ResponseEntity.ok(new Status(row.getStatus().name(), row.getErrorMessage()==null?"OK":row.getErrorMessage()));
    }

    @GetMapping
    public ResponseEntity<?> get(@PathVariable String meetingId){
        var row = repo.findByMeetingId(meetingId).orElseThrow();
        if(!"COMPLETED".equals(row.getStatus().name())) return ResponseEntity.badRequest().body("{\"error\":\"Summary not ready\"}");
        return ResponseEntity.ok(row.getSummaryJson());
    }

    record Status(String status, String message){}
}