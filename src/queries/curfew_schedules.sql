SELECT
  member_id,
  day_type,
  curfew_time,
  updated_at
FROM app_curfew_manager__curfews
ORDER BY member_id, day_type
LIMIT 200
