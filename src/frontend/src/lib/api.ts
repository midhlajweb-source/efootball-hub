import type { AdminError } from "@/backend";

/** Human-readable message for a backend `AdminError` variant. */
export function adminErrorMessage(error: AdminError): string {
  switch (error.__kind__) {
    case "invalidCredentials":
      return "Incorrect username or password.";
    case "notAuthenticated":
      return "Your admin session has expired. Please sign in again.";
    case "notFound":
      return "That record no longer exists.";
    case "invalidInput":
      return error.invalidInput;
    default:
      return "Something went wrong. Please try again.";
  }
}

/** Unwrap a `Result`-shaped backend response, throwing the mapped error otherwise. */
export function unwrapResult<T>(
  result: { __kind__: "ok"; ok: T } | { __kind__: "err"; err: AdminError },
): T {
  if (result.__kind__ === "ok") return result.ok;
  throw new Error(adminErrorMessage(result.err));
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

/** Parse a whole-number text input into a non-negative bigint, or null when invalid. */
export function parseCount(value: string): bigint | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return BigInt(trimmed);
}

export function parseOptionalCount(value: string): bigint | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  return parseCount(trimmed);
}
