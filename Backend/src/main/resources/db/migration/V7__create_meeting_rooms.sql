CREATE TABLE IF NOT EXISTS meeting_rooms (
    id                        BIGINT         NOT NULL AUTO_INCREMENT,
    meeting_id                VARCHAR(36)    NOT NULL,
    title                     VARCHAR(150),
    host_user_id              BIGINT         NOT NULL,
    status                    VARCHAR(255)   NOT NULL,
    max_participants          INT            NOT NULL,
    current_participant_count INT            NOT NULL DEFAULT 0,
    expires_at                DATETIME(6),
    created_at                DATETIME(6),
    closed_at                 DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_meeting_rooms_meeting_id (meeting_id)
);
