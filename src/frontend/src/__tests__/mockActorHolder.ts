import type { MockActor } from "./mockBackend";

/**
 * Mutable holder shared between the global `vi.mock` registration in
 * `setup.ts` and the per-test `renderWithProviders` helper.
 *
 * `vi.mock` is hoisted per test file, so a mock registered inside a helper
 * module does not intercept imports made by the test file's own graph. The
 * setup file runs for every test file, so registering the mock there and
 * reading the current actor from this holder is what makes the seam apply to
 * the pages under test.
 */
export interface ActorSeam {
  actor: MockActor | null;
  isFetching: boolean;
}

export const actorSeam: ActorSeam = {
  actor: null,
  isFetching: false,
};

export function setActorSeam(
  actor: MockActor | null,
  isFetching = false,
): void {
  actorSeam.actor = actor;
  actorSeam.isFetching = isFetching;
}
