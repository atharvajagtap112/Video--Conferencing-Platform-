package com.atharva.backend.ai.repository;

import com.atharva.backend.ai.model.MeetingRecording;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface MeetingRecordingRepository extends JpaRepository<MeetingRecording, Long> {
    Optional<MeetingRecording> findByMeetingId(String meetingId);
}