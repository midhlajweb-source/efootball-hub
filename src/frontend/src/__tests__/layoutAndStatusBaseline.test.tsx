import { MatchStatus } from "@/backend";
import { Layout } from "@/components/Layout";
import { StatusPage } from "@/pages/StatusPage";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createMockState, makeFixture, makeTeam } from "./mockBackend";
import { renderWithProviders } from "./renderWithProviders";

/**
 * Characterization of the public shell and the Status page, taken before the
 * theme toggle and the two leader sections are added.
 *
 * The upcoming work intentionally changes three things: the nav bar gains a
 * sun/moon theme button, `index.css` gains a real light token set, and
 * `StatusPage` gains "Best Scoring Teams" / "Best Conceding Teams" sections.
 * This file deliberately does NOT freeze the current absence of those — it
 * protects the surrounding behavior that must survive the change:
 *
 *   - the public nav's existing items, Admin link, and mobile menu;
 *   - the Status page's Live / Upcoming / Completed grouping, scores, and
 *     empty state.
 *
 * The actor is the local typed mock in `mockBackend.ts`, so this proves the
 * components, hooks, and rendering — not the Motoko canister. The PocketIC lane
 * is what calls the real backend.
 */

const KICKOFF = 1_700_000_000_000_000_000n;

describe("public Layout nav baseline", () => {
  it("renders the brand, the four public nav links, and the Admin link", async () => {
    renderWithProviders(<Layout>content</Layout>, { state: createMockState() });

    // The router resolves asynchronously, so the first query must await.
    // The brand link and the Home nav item share the `nav.home_link` ocid, so
    // assert the nav item by its accessible name.
    expect(await screen.findByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Status" })).toHaveAttribute(
      "href",
      "/status",
    );
    expect(screen.getByRole("link", { name: "League Table" })).toHaveAttribute(
      "href",
      "/table",
    );
    expect(screen.getByRole("link", { name: "Knockout" })).toHaveAttribute(
      "href",
      "/bracket",
    );
    expect(screen.getByTestId("nav.admin_link")).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("opens the mobile menu with the same destinations and closes it again", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Layout>content</Layout>, { state: createMockState() });

    const toggle = await screen.findByTestId("nav.menu_toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    // The mobile menu mirrors the desktop destinations, including Admin.
    expect(screen.getByTestId("nav.mobile_home_link")).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByTestId("nav.mobile_status_link")).toHaveAttribute(
      "href",
      "/status",
    );
    expect(screen.getByTestId("nav.mobile_league_table_link")).toHaveAttribute(
      "href",
      "/table",
    );
    expect(screen.getByTestId("nav.mobile_knockout_link")).toHaveAttribute(
      "href",
      "/bracket",
    );
    expect(screen.getByTestId("nav.mobile_admin_link")).toHaveAttribute(
      "href",
      "/admin",
    );

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByTestId("nav.mobile_admin_link"),
    ).not.toBeInTheDocument();
  });
});

describe("StatusPage baseline", () => {
  it("groups matches into Live, Upcoming, and Completed with scores and kickoff", async () => {
    const state = createMockState({
      stageLabel: "League Stage — Matchday 2",
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
        makeTeam(3n, "Harbour City", "HBC"),
        makeTeam(4n, "Valley Rangers", "VLR"),
      ],
      fixtures: [
        makeFixture(1n, 1n, 2n, MatchStatus.live, {
          homeGoals: 2n,
          awayGoals: 1n,
          kickoff: KICKOFF,
        }),
        makeFixture(2n, 3n, 4n, MatchStatus.upcoming, { kickoff: KICKOFF }),
        makeFixture(3n, 2n, 3n, MatchStatus.completed, {
          homeGoals: 0n,
          awayGoals: 3n,
          kickoff: KICKOFF,
        }),
      ],
    });
    renderWithProviders(<StatusPage />, { state });

    expect(
      await screen.findByRole("heading", { name: "League Stage — Matchday 2" }),
    ).toBeInTheDocument();

    const live = screen.getByTestId("status.live_section");
    expect(within(live).getByText("Northside United")).toBeInTheDocument();
    expect(within(live).getByText("Riverside FC")).toBeInTheDocument();
    const liveItem = within(live).getByTestId("status.live_section.item");
    expect(within(liveItem).getByText("2")).toBeInTheDocument();
    expect(within(liveItem).getByText("1")).toBeInTheDocument();

    const upcoming = screen.getByTestId("status.upcoming_section");
    expect(within(upcoming).getByText("Harbour City")).toBeInTheDocument();
    expect(within(upcoming).getByText("Valley Rangers")).toBeInTheDocument();

    const completed = screen.getByTestId("status.completed_section");
    expect(within(completed).getByText("Harbour City")).toBeInTheDocument();
    const completedItem = within(completed).getByTestId(
      "status.completed_section.item",
    );
    expect(within(completedItem).getByText("3")).toBeInTheDocument();

    // The footer summary counts each group.
    expect(
      screen.getByText(/1 live · 1 upcoming · 1 completed/),
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no matches", async () => {
    renderWithProviders(<StatusPage />, { state: createMockState() });
    expect(await screen.findByTestId("empty_state")).toBeInTheDocument();
  });

  it("renders each group's own empty message when only some groups have matches", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      fixtures: [
        makeFixture(1n, 1n, 2n, MatchStatus.completed, {
          homeGoals: 1n,
          awayGoals: 0n,
          kickoff: KICKOFF,
        }),
      ],
    });
    renderWithProviders(<StatusPage />, { state });

    const live = await screen.findByTestId("status.live_section");
    expect(within(live).getByText("No live matches.")).toBeInTheDocument();
    const upcoming = screen.getByTestId("status.upcoming_section");
    expect(
      within(upcoming).getByText("No upcoming matches."),
    ).toBeInTheDocument();
    const completed = screen.getByTestId("status.completed_section");
    expect(within(completed).getByText("Northside United")).toBeInTheDocument();
  });
});
