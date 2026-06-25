package com.atharva.backend.repository;

import com.atharva.backend.auth.entity.User;
import com.atharva.backend.room.entity.MeetingRoom;
import com.atharva.backend.room.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    Optional<Participant> findByMeetingRoomAndUserAndLeftAtIsNull(
            MeetingRoom meetingRoom, User user
    );


    Optional<Participant> findByMeetingRoomAndUser(
            MeetingRoom meetingRoom, User user
    );

    @Modifying
    @Query("UPDATE Participant p SET p.leftAt = :now WHERE p.meetingRoom.id = :roomId AND p.leftAt IS NULL")
    void markAllAsLeft(Long roomId, LocalDateTime now);

    boolean existsByUserAndMeetingRoom(User user, MeetingRoom room);


    @Query("""
        select p from Participant p
        join fetch p.meetingRoom r
        where p.user.id = :userId
        order by p.joinedAt desc
    """)
    List<Participant> findHistoryByUserId(@Param("userId") Long userId);


}



