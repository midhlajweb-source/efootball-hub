import App from "@/App";
import { ThemeProvider } from "@/hooks/useTheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setActorSeam } from "./mockActorHolder";
import { createMockActor, createMockState } from "./mockBackend";

/**
 * Characterization of the app's default route.
 *
 * The other suites render individual pages inside a test router. This one
 * mounts the real `App` router at `/` to protect the acceptance criterion that
 * the app loads without a blank screen on its default route — a broken route
 * tree, provider, or layout would render nothing here.
 *
 * The actor is still the local mock, so this proves the frontend shell boots,
 * not that the deployed canister answers.
 */
describe("App default route", () => {
  beforeEach(() => {
    // The real router reads the browser URL; start every test at the root.
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("renders the home hub instead of a blank screen at /", async () => {
    const state = createMockState({
      tournamentName: "Midhu Champions Cup",
      stageLabel: "League Stage — Matchday 1",
    });
    setActorSeam(createMockActor(state), false);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    // The router renders asynchronously, so the first query must await.
    expect(
      await screen.findByRole("heading", { name: "Midhu Champions Cup" }),
    ).toBeInTheDocument();
    // The public layout chrome is present, proving the shell mounted. The
    // header logo and the nav item share the `nav.home_link` ocid, so assert
    // the nav link by its accessible name.
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByTestId("home.stage_label")).toHaveTextContent(
      "League Stage — Matchday 1",
    );
  });
});
