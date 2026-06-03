SELECT
  id,
  member_id,
  date,
  requested_time,
  reason,
  status,
  created_at
FROM exception_requests
WHERE household_id = current_setting('app.household_id', true)::uuid
  AND status = 'pending'
ORDER BY date ASC, requested_time ASC
LIMIT 100
