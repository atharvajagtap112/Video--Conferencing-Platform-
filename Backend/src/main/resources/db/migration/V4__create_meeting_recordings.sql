

CREATE TABLE IF NOT EXISTS meeting_recordings (
id BIGINT PRIMARY KEY AUTO_INCREMENT,
meeting_id VARCHAR(64) NOT NULL,
recording_path TEXT NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT uk_meeting_recordings_meeting_id UNIQUE (meeting_id)
);