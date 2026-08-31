-- The exception_requests preload runs on every app launch and orders by a CASE
-- that buckets status pending/approved/other, then date and requested_time. A
-- computed ordering cannot be served by an index on `status`, so every request
-- was read and sorted in a temp b-tree.
--
-- SQLite indexes expressions, so the bucket is stored precomputed. The CASE must
-- stay byte-identical to the one in the preload — the planner matches index
-- expressions structurally, and a reordered WHEN or a changed ELSE is a
-- different expression it will not use.
--
-- The `status != 'denied' OR date >= ...` filter still has to be evaluated per
-- row: an OR across two columns needs an index on each arm to become a lookup,
-- and no index can seek a `!=`. Removing the sort is the win here.
--
-- status is plaintext (a skip-encrypt column) and date/requested_time are
-- declared in db_plaintext_columns, so this index orders real values.
CREATE INDEX IF NOT EXISTS app_curfew_manager__exception_requests_order_idx
  ON app_curfew_manager__exception_requests (
    (CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END),
    date ASC,
    requested_time ASC
  );
