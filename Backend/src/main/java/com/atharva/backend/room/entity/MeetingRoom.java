package com.atharva.backend.room.entity;




import com.atharva.backend.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_rooms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MeetingRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The unique, human-readable meeting ID (e.g., "abc-defg-hij").
     * This is what users share and type to join.
     */
    @Column(nullable = false, unique = true, length = 36)
    private String meetingId;

    @Column(length = 150)
    private String title;

    /**
     * The user who created this room.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id", nullable = false)
    private User host;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomStatus status; // ACTIVE, EXPIRED, CLOSED

    @Column(nullable = false)
    private int maxParticipants; // e.g., 100

    @Column(nullable = false)
    private int currentParticipantCount;

    /**
     * Room auto-expires after this time (e.g., created + 4 hours).
     */
    private LocalDateTime expiresAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime closedAt;


}

