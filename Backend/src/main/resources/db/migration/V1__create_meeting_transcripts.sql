CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  meeting_id VARCHAR(64) NOT NULL,
  speaker VARCHAR(100) NOT NULL,
  text TEXT NOT NULL,
  started_at_ms BIGINT NULL,
  ended_at_ms BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_meeting_transcripts_meeting_id (meeting_id),
  INDEX idx_meeting_transcripts_created_at (created_at)
);