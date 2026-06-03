-- Per-child curfew schedule, one row per child per day type.
-- day_type: "weekday" (Mon–Fri) or "weekend" (Sat–Sun)
-- curfew_time: "HH:MM" 24-hour format, or NULL = no curfew set
CREATE TABLE IF NOT EXISTS curfews (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  member_id    TEXT NOT NULL,
  day_type     TEXT NOT NULL,
  curfew_time  TEXT,
  updated_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, member_id, day_type)
);

-- One-time exception requests from children
CREATE TABLE IF NOT EXISTS exception_requests (
  household_id   UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
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
  PRIMARY KEY (household_id, id)
);

CREATE INDEX IF NOT EXISTS exception_requests_member_idx
  ON exception_requests (household_id, member_id);

CREATE INDEX IF NOT EXISTS exception_requests_status_idx
  ON exception_requests (household_id, status);
