-- The only existing indexes lead with member_id and status, so the retention
-- sweep's `WHERE created_at < ?` had no index to use.
CREATE INDEX IF NOT EXISTS app_curfew_manager__exception_requests_retention_idx
  ON app_curfew_manager__exception_requests (created_at);
