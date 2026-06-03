export { isAdult } from "./shared.js";

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
