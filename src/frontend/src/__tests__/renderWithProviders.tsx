import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

import { ThemeProvider } from "@/hooks/useTheme";

import { setActorSeam } from "./mockActorHolder";
import {
  type MockActor,
  type MockBackendState,
  createMockActor,
} from "./mockBackend";

/** The localStorage key `useAdminSession` reads its token from. */
export const ADMIN_TOKEN_KEY = "efootball.admin.token";

export interface RenderOptions {
  state: MockBackendState;
  /** Initial history entries; the last one is the active route. */
  initialEntries?: string[];
  /**
   * When set, seeds a valid admin session in both the mock backend and
   * `localStorage` so `useAdminSession` reports an authenticated session.
   */
  adminToken?: string;
}

export interface RenderResult {
  actor: MockActor;
  queryClient: QueryClient;
}

/**
 * Renders a single component inside the providers the app uses, with the actor
 * seam (registered globally in `setup.ts`) pointed at a local mock. Returns the
 * mock actor so a test can assert on the calls a component made.
 *
 * The router mirrors the app's route shape — the public routes plus the admin
 * routes `AdminLayout` links to — so components that read `useParams` or render
 * navigation links resolve exactly as they do in the app.
 *
 * `ThemeProvider` wraps the tree because the public `Layout` and `AdminLayout`
 * both render `ThemeToggle`, which reads the theme context. `main.tsx` mounts
 * the same provider around the real app.
 */
export function renderWithProviders(
  ui: ReactElement,
  { state, initialEntries = ["/"], adminToken }: RenderOptions,
): RenderResult {
  const actor = createMockActor(state);
  setActorSeam(actor, false);

  if (adminToken) {
    state.sessions.set(adminToken, { token: adminToken, username: "Midhu" });
    window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
  } else {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  // The app registers the match detail route under `/public/match/$matchId`
  // (see `MatchDetailPage`'s `useParams({ from: "/public/match/$matchId" })`),
  // while `StatusPage` links to the shorter `/match/$matchId`. Register both so
  // either entry point resolves.
  const publicMatchRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/public/match/$matchId",
    component: () => ui,
  });
  const matchRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/match/$matchId",
    component: () => ui,
  });
  // Every other path (including the admin routes `AdminLayout` links to) is
  // served by the catch-all, which renders the single component under test.
  const catchAllRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "$",
    component: () => ui,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      indexRoute,
      publicMatchRoute,
      matchRoute,
      catchAllRoute,
    ]),
    history: createMemoryHistory({ initialEntries }),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );

  return { actor, queryClient };
}
