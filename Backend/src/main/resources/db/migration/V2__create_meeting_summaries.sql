CREATE TABLE IF NOT EXISTS meeting_summaries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  meeting_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  summary_json LONGTEXT NULL,
  model VARCHAR(128) NULL,
  error_message VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uk_meeting_summaries_meeting_id UNIQUE (meeting_id),
  INDEX idx_meeting_summaries_status (status)
);