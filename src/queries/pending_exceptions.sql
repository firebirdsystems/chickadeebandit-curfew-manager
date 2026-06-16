SELECT
  id,
  member_id,
  date,
  requested_time,
  reason,
  status,
  created_at
FROM app_curfew_manager__exception_requests
WHERE status = 'pending'
ORDER BY date ASC, requested_time ASC
LIMIT 100
