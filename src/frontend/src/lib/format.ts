import { KnockoutRound, MatchStatus } from "@/backend";

/** Motoko `Time.now()` values are nanosecond bigints. Convert before any Date use. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATE_ONLY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatKickoff(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "Date to be confirmed";
  return DATE_TIME.format(date);
}

export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "Date to be confirmed";
  return DATE_ONLY.format(date);
}

/** Value for a `datetime-local` input, in the browser's local timezone. */
export function toDateTimeLocalValue(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** Convert a `datetime-local` value back into a nanosecond timestamp. */
export function fromDateTimeLocalValue(value: string): bigint | null {
  if (!value) return null;
  const millis = new Date(value).getTime();
  if (Number.isNaN(millis)) return null;
  return BigInt(millis) * 1_000_000n;
}

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  [MatchStatus.upcoming]: "Upcoming",
  [MatchStatus.live]: "Live",
  [MatchStatus.completed]: "Completed",
};

export const KNOCKOUT_ROUND_LABEL: Record<KnockoutRound, string> = {
  [KnockoutRound.roundOf16]: "Round of 16",
  [KnockoutRound.quarterFinal]: "Quarter Finals",
  [KnockoutRound.semiFinal]: "Semi Finals",
  [KnockoutRound.final]: "Final",
};

export const KNOCKOUT_ROUND_ORDER: KnockoutRound[] = [
  KnockoutRound.roundOf16,
  KnockoutRound.quarterFinal,
  KnockoutRound.semiFinal,
  KnockoutRound.final,
];

export function formatGoal(value: bigint | undefined): string {
  return value === undefined ? "–" : value.toString();
}

/**
 * Penalty shootout score, e.g. `(4-3 pens)`. Returns null unless both sides of
 * the shootout were recorded, so a normal-time result never renders a partial
 * shootout line.
 */
export function formatPenalties(
  home: bigint | undefined,
  away: bigint | undefined,
): string | null {
  if (home === undefined || away === undefined) return null;
  return `(${home.toString()}-${away.toString()} pens)`;
}

/** True when a tie was level after normal time and so needed a shootout. */
export function isLevelAfterNormalTime(
  home: bigint | null | undefined,
  away: bigint | null | undefined,
): boolean {
  return home != null && away != null && home === away;
}

export function formatGoalDifference(value: bigint): string {
  return value > 0n ? `+${value.toString()}` : value.toString();
}

/** Two-letter monogram used when a team has no uploaded crest. */
export function teamMonogram(shortCode: string, name: string): string {
  const source = shortCode.trim() || name.trim();
  return source.slice(0, 2).toUpperCase() || "??";
}

/**
 * League-table column metadata. The `short` token is the compact header shown
 * on screen; `label` is the full, screen-reader-friendly name so abbreviations
 * such as GF, GC and GD stay understandable.
 */
export interface TableColumn {
  key:
    | "played"
    | "won"
    | "drawn"
    | "lost"
    | "goalsFor"
    | "goalsAgainst"
    | "goalDifference"
    | "points";
  short: string;
  label: string;
}

export const TABLE_COLUMNS: TableColumn[] = [
  { key: "played", short: "P", label: "Played" },
  { key: "won", short: "W", label: "Won" },
  { key: "drawn", short: "D", label: "Drawn" },
  { key: "lost", short: "L", label: "Lost" },
  { key: "goalsFor", short: "GF", label: "Goals For" },
  { key: "goalsAgainst", short: "GC", label: "Goals Against" },
  { key: "goalDifference", short: "GD", label: "Goal Difference" },
  { key: "points", short: "Pts", label: "Points" },
];
