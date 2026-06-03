SELECT
  member_id,
  day_type,
  curfew_time,
  updated_at
FROM curfews
WHERE household_id = current_setting('app.household_id', true)::uuid
ORDER BY member_id, day_type
LIMIT 200
