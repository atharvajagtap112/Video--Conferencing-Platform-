package com.atharva.backend.room.entity;


import com.atharva.backend.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "participants",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"meeting_room_id", "user_id", "joined_at"}
        ))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_room_id", nullable = false)
    private MeetingRoom meetingRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantRole role; // HOST, CO_HOST, GUEST

    @CreationTimestamp
    private LocalDateTime joinedAt;

    private LocalDateTime leftAt;

    /**
     * WebSocket session ID, used to route signaling messages.
     */
    @Column(length = 100)
    private String sessionId;


}

