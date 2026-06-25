-- V6: Clean up conflicting V1/V2/V3/V4/V5 table schemas.
-- Drop and recreate with the correct schema matching JPA entities.

DROP TABLE IF EXISTS meeting_transcripts;
DROP TABLE IF EXISTS meeting_summaries;
DROP TABLE IF EXISTS meeting_recordings;

CREATE TABLE meeting_recordings (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  meeting_id     VARCHAR(64)  NOT NULL,
  recording_path TEXT         NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_meeting_recordings_mid UNIQUE (meeting_id)
);

CREATE TABLE meeting_transcripts (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  meeting_id      VARCHAR(64)   NOT NULL,
  transcript_text LONGTEXT      NULL,
  status          VARCHAR(32)   NOT NULL DEFAULT 'PENDING',
  error_message   VARCHAR(1000) NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_meeting_transcripts_mid UNIQUE (meeting_id)
);

CREATE TABLE meeting_summaries (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  meeting_id    VARCHAR(64)   NOT NULL,
  status        VARCHAR(32)   NOT NULL DEFAULT 'PENDING',
  summary_json  LONGTEXT      NULL,
  model         VARCHAR(128)  NULL,
  error_message VARCHAR(1000) NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_meeting_summaries_mid UNIQUE (meeting_id)
);
