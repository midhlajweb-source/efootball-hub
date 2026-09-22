import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { actorSeam } from "./mockActorHolder";

// Generated components use `data-ocid`; make it the test-id attribute so
// `getByTestId` reads the same hook the app already ships.
configure({ testIdAttribute: "data-ocid" });

/**
 * Replace the actor/identity seam for every test file.
 *
 * `useActor` reads the identity from `useInternetIdentity`, and the real
 * `useInternetIdentity` throws unless an `InternetIdentityProvider` wraps the
 * tree. Mocking both here — in the setup file that runs before each test
 * file's module graph is imported — is what lets the real hooks and pages run
 * against the local typed actor in `mockBackend.ts`.
 */
vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({
    actor: actorSeam.actor,
    isFetching: actorSeam.isFetching,
  }),
  useInternetIdentity: () => ({
    identity: undefined,
    isAuthenticated: false,
    loginStatus: "idle",
    isInitializing: false,
    isLoginIdle: true,
    isLoggingIn: false,
    isLoginSuccess: false,
    isLoginError: false,
    loginError: undefined,
    login: () => {},
    clear: () => {},
  }),
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  actorSeam.actor = null;
  actorSeam.isFetching = false;
});
