package com.atharva.backend.repository;


import com.atharva.backend.room.entity.MeetingRoom;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Long> {
    Optional<MeetingRoom> findByMeetingId(String meetingId);
    boolean existsByMeetingId(String meetingId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM MeetingRoom r WHERE r.meetingId = :meetingId")
    Optional<MeetingRoom> findByMeetingIdForUpdate(String meetingId);
}