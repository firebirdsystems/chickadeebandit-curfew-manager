import { isAdult } from "./shared.js";
export { isAdult };

/**
 * Format a 24-hour time string to 12-hour display.
 * "21:30" → "9:30 PM", "09:00" → "9:00 AM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Format a "YYYY-MM-DD" string to a human-readable date.
 * "2026-06-13" → "Sat Jun 13"
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  // Parse as local date to avoid UTC offset shifting the day
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Returns "weekday" for Monday–Friday, "weekend" for Saturday–Sunday.
 * Accepts a "YYYY-MM-DD" string or a Date object.
 */
export function getDayType(date) {
  const dt = typeof date === "string"
    ? (() => { const [y, m, d] = date.split("-").map(Number); return new Date(y, m - 1, d); })()
    : date;
  const dow = dt.getDay(); // 0=Sun, 6=Sat
  return (dow === 0 || dow === 6) ? "weekend" : "weekday";
}

/**
 * Given the loaded curfews array and a member ID + date string ("YYYY-MM-DD"),
 * returns the curfew time ("HH:MM") or null if none is set.
 * @param {Array<{member_id: string, day_type: string, curfew_time: string|null}>} curfews
 */
export function getCurfewForDate(curfews, memberId, dateStr) {
  const dayType = getDayType(dateStr);
  const row = curfews.find(c => c.member_id === memberId && c.day_type === dayType);
  return row?.curfew_time ?? null;
}

/**
 * Given a curfew time and a requested time (both "HH:MM"),
 * returns true if the request extends past curfew.
 */
export function exceedsCurfew(curfewTime, requestedTime) {
  if (!curfewTime || !requestedTime) return false;
  return requestedTime > curfewTime; // lexicographic comparison works for "HH:MM"
}

export const STATUS_INFO = {
  pending:  { cls: "status-pending",  label: "Pending" },
  approved: { cls: "status-approved", label: "Approved" },
  denied:   { cls: "status-denied",   label: "Denied" },
};

/**
 * Fields the in-app search matches against (see hub-sdk `searchMatch`).
 * The reason is the request, and the review note is the answer —
 * both are what a past exception gets looked up by.
 */
export function searchableFields(item) {
  return [item.reason, item.review_note, item.date];
}

/**
 * Whether a member reviews other members' exception requests. Mirrors the
 * hub's rule for the exception_requests table: any adult in a household, and
 * only the steward in a shared space. An adult who merely takes part in a
 * space reads nobody else's requests and may not answer them.
 */
export function reviewsRequests(member, { tenantKind = "household", isAdmin = false } = {}) {
  return tenantKind === "household" ? isAdult(member) : isAdmin === true;
}

/**
 * True when the member list loaded and holds no child. Curfews are set for
 * children, so without one there is nothing to schedule or review. An empty
 * list means the members could not be read, which says nothing either way.
 */
export function hasNoChildren(members) {
  return members.length > 0 && !members.some(m => !isAdult(m));
}

// ── Retry after a lost response (app-template guide) ─────────────────────────

/**
 * Whether a failed create's answer leaves its outcome unknown — no status, a
 * 400, or a 5xx other than 507 — so the page reads the row back by its pinned
 * id. A `UNIQUE_CONSTRAINT` answer is a 400 too: the usual retry of a create
 * that landed collides on its own pinned id. Only finding the row under that
 * id says it landed.
 */
export function outcomeUnknown(e) {
  if (e?.code === "UNIQUE_CONSTRAINT" || /UNIQUE constraint failed/i.test(String(e?.message ?? ""))) return true;
  const status = Number(e?.status) || 0;
  return status === 0 || status === 400 || (status >= 500 && status !== 507);
}

/**
 * Whether a stored row differs from what the form holds now, over the form's
 * own fields only, compared as text with a missing value as empty.
 */
export function storedDiffers(row, fields) {
  return Object.keys(fields).some((k) => String(row?.[k] ?? "") !== String(fields[k] ?? ""));
}

export const SAVED_AS_FIRST = "Saved as first entered — check it and update what changed.";

/**
 * The line a failed write shows ("Refused, gone, or failed" in the app-template
 * guide): "try again" only when retrying can work. `action` and `thing` are the
 * app's own words. `found` is the caller's re-read after a write that changed
 * nothing: false = the row is gone, true = it is still there, null = the
 * re-read failed. A row still there after a plain `WHERE id = ?` write means
 * the row policy refused it; only a `guarded` write (one with a state
 * condition) can have been "changed by someone else". Decided from the error's
 * `status` / `code`, never from the hub's or the browser's text.
 */
export function failureLine(e, { action, thing, found, guarded = false } = {}) {
  if (e?.forUser) return e.message;
  if (e?.code === "UNIQUE_CONSTRAINT" || /UNIQUE constraint failed/i.test(String(e?.message ?? ""))) return `That ${thing} already exists.`;
  if (e?.status === 403 || (found === true && !guarded)) return `You don’t have permission to ${action}.`;
  if (e?.status === 507) return "The household’s storage is full — free up space first.";
  if (e?.status === 429) return "Too many tries — wait a minute and try again.";
  if (found === null) return `Couldn’t ${action} — try again.`;
  if (found === false || (found === undefined && e?.status === 404)) return `This ${thing} has been removed.`;
  if (found === true || e?.status === 409) return `This ${thing} was changed by someone else — check it first.`;
  return `Couldn’t ${action} — try again.`;
}
