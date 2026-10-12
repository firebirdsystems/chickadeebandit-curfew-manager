import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDate,
  getDayType,
  getCurfewForDate,
  exceedsCurfew, searchableFields, reviewsRequests, hasNoChildren,
} from "../src/logic.js";

describe("formatTime", () => {
  it("formats midnight", ()   => expect(formatTime("00:00")).toBe("12:00 AM"));
  it("formats noon", ()       => expect(formatTime("12:00")).toBe("12:00 PM"));
  it("formats 9 PM", ()       => expect(formatTime("21:00")).toBe("9:00 PM"));
  it("formats 9:30 PM", ()    => expect(formatTime("21:30")).toBe("9:30 PM"));
  it("formats 9 AM", ()       => expect(formatTime("09:00")).toBe("9:00 AM"));
  it("formats 11:59 PM", ()   => expect(formatTime("23:59")).toBe("11:59 PM"));
  it("returns empty on null", () => expect(formatTime(null)).toBe(""));
  it("returns empty on empty", () => expect(formatTime("")).toBe(""));
});

describe("getDayType", () => {
  it("Monday is weekday",   () => expect(getDayType("2026-06-01")).toBe("weekday")); // Mon
  it("Friday is weekday",   () => expect(getDayType("2026-06-05")).toBe("weekday")); // Fri
  it("Saturday is weekend", () => expect(getDayType("2026-06-06")).toBe("weekend")); // Sat
  it("Sunday is weekend",   () => expect(getDayType("2026-06-07")).toBe("weekend")); // Sun
  it("accepts Date objects", () => {
    expect(getDayType(new Date(2026, 5, 6))).toBe("weekend"); // Jun 6 2026 = Sat
  });
});

describe("formatDate", () => {
  it("formats a weekday", () => expect(formatDate("2026-06-01")).toMatch(/Mon/));
  it("formats a weekend", () => expect(formatDate("2026-06-06")).toMatch(/Sat/));
  it("returns empty on null", () => expect(formatDate(null)).toBe(""));
  it("returns empty on empty", () => expect(formatDate("")).toBe(""));
});

describe("getCurfewForDate", () => {
  const curfews = [
    { member_id: "kid-1", day_type: "weekday", curfew_time: "21:00" },
    { member_id: "kid-1", day_type: "weekend", curfew_time: "22:30" },
    { member_id: "kid-2", day_type: "weekday", curfew_time: "20:00" },
  ];

  it("returns weekday curfew on a Monday", () =>
    expect(getCurfewForDate(curfews, "kid-1", "2026-06-01")).toBe("21:00"));

  it("returns weekend curfew on a Saturday", () =>
    expect(getCurfewForDate(curfews, "kid-1", "2026-06-06")).toBe("22:30"));

  it("returns null when no curfew set for that day type", () =>
    expect(getCurfewForDate(curfews, "kid-2", "2026-06-06")).toBeNull());

  it("returns null for unknown member", () =>
    expect(getCurfewForDate(curfews, "unknown", "2026-06-01")).toBeNull());

  it("returns null for empty curfews array", () =>
    expect(getCurfewForDate([], "kid-1", "2026-06-01")).toBeNull());
});

describe("exceedsCurfew", () => {
  it("returns true when request is past curfew",  () => expect(exceedsCurfew("21:00", "23:00")).toBe(true));
  it("returns false when request is before curfew", () => expect(exceedsCurfew("21:00", "20:00")).toBe(false));
  it("returns false when request equals curfew",  () => expect(exceedsCurfew("21:00", "21:00")).toBe(false));
  it("returns false when curfew is null",          () => expect(exceedsCurfew(null, "23:00")).toBe(false));
  it("returns false when requested time is null",  () => expect(exceedsCurfew("21:00", null)).toBe(false));
});

describe("searchableFields", () => {
  it("matches on the reason asked and the note given back", () => {
    const fields = searchableFields({ reason: "concert finishes late", review_note: "ok, taxi home", date: "2026-03-04" });
    expect(fields).toContain("concert finishes late");
    expect(fields).toContain("ok, taxi home");
  });
});

describe("reviewsRequests", () => {
  const adult = { id: "a1", role: "adult" };
  const child = { id: "c1", role: "child" };

  it("any adult reviews in a household, which is the default", () => {
    expect(reviewsRequests(adult)).toBe(true);
    expect(reviewsRequests(child)).toBe(false);
    expect(reviewsRequests(null)).toBe(false);
  });

  it("only the steward reviews in a shared space", () => {
    expect(reviewsRequests(adult, { tenantKind: "shared_space", isAdmin: false })).toBe(false);
    expect(reviewsRequests(adult, { tenantKind: "shared_space", isAdmin: true })).toBe(true);
  });

  it("being a household's admin does not make a child a reviewer", () => {
    expect(reviewsRequests(child, { tenantKind: "household", isAdmin: true })).toBe(false);
  });
});

describe("hasNoChildren", () => {
  it("is true for a loaded list of adults only", () => {
    expect(hasNoChildren([{ id: "a1", role: "adult" }, { id: "a2", role: "adult" }])).toBe(true);
  });

  it("is false once any member is not an adult", () => {
    expect(hasNoChildren([{ id: "a1", role: "adult" }, { id: "c1", role: "child" }])).toBe(false);
  });

  it("is false for an empty list, which means the members did not load", () => {
    expect(hasNoChildren([])).toBe(false);
  });
});
