package com.atharva.backend.ai.repository;
import com.atharva.backend.ai.model.MeetingSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface MeetingSummaryRepository extends JpaRepository<MeetingSummary, Long> {
    Optional<MeetingSummary> findByMeetingId(String meetingId);
}