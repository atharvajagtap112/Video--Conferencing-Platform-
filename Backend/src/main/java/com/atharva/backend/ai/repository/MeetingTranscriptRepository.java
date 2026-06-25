package com.atharva.backend.ai.repository;
import com.atharva.backend.ai.model.MeetingTranscript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface MeetingTranscriptRepository extends JpaRepository<MeetingTranscript, Long> {
    Optional<MeetingTranscript> findByMeetingId(String meetingId);
}