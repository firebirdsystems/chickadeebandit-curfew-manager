-- Per-child curfew schedule, one row per child per day type.
-- day_type: "weekday" (Mon–Fri) or "weekend" (Sat–Sun)
-- curfew_time: "HH:MM" 24-hour format, or NULL = no curfew set
CREATE TABLE IF NOT EXISTS app_curfew_manager__curfews (
  member_id    TEXT NOT NULL,
  day_type     TEXT NOT NULL,
  curfew_time  TEXT,
  updated_at   TEXT NOT NULL,
  PRIMARY KEY (member_id, day_type)
);

-- One-time exception requests from children
CREATE TABLE IF NOT EXISTS app_curfew_manager__exception_requests (
  id             TEXT NOT NULL,
  member_id      TEXT NOT NULL,
  date           TEXT NOT NULL,
  requested_time TEXT NOT NULL,
  reason         TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  reviewed_by    TEXT,
  reviewed_at    TEXT,
  review_note    TEXT,
  created_at     TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS exception_requests_member_idx
  ON app_curfew_manager__exception_requests (member_id);

CREATE INDEX IF NOT EXISTS exception_requests_status_idx
  ON app_curfew_manager__exception_requests (status);
