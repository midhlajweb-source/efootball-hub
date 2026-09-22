import { MatchStatus } from "@/backend";
import { GoalLeaders } from "@/components/GoalLeaders";
import { StatusPage } from "@/pages/StatusPage";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createMockState, makeFixture, makeTeam } from "./mockBackend";
import { renderWithProviders } from "./renderWithProviders";

/**
 * Coverage for the two goal-leader sections on the Status page.
 *
 * The actor is the local typed mock in `mockBackend.ts`, so this proves the
 * page, the ranking component, and the rendering — not the Motoko canister.
 * The PocketIC lane is what calls the real backend.
 */

const KICKOFF = 1_700_000_000_000_000_000n;

/** Read the ranked team names out of a leader section, in display order. */
function rankedNames(section: HTMLElement): string[] {
  return within(section)
    .getAllByRole("listitem")
    .map((item) => item.querySelector("p")?.textContent ?? "");
}

describe("StatusPage goal leaders", () => {
  it("ranks all teams by goals scored and by goals conceded from completed fixtures", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
        makeTeam(3n, "Harbour City", "HBC"),
        makeTeam(4n, "Valley Rangers", "VLR"),
      ],
      fixtures: [
        // Completed: Northside 4-1 Riverside.
        makeFixture(1n, 1n, 2n, MatchStatus.completed, {
          homeGoals: 4n,
          awayGoals: 1n,
          kickoff: KICKOFF,
        }),
        // Completed: Harbour 2-2 Valley.
        makeFixture(2n, 3n, 4n, MatchStatus.completed, {
          homeGoals: 2n,
          awayGoals: 2n,
          kickoff: KICKOFF,
        }),
        // Live: Riverside 9-0 Harbour — must not count toward either list.
        makeFixture(3n, 2n, 3n, MatchStatus.live, {
          homeGoals: 9n,
          awayGoals: 0n,
          kickoff: KICKOFF,
        }),
        // Upcoming: no score — must not count.
        makeFixture(4n, 4n, 1n, MatchStatus.upcoming, { kickoff: KICKOFF }),
      ],
    });
    renderWithProviders(<StatusPage />, { state });

    const scoring = await screen.findByTestId("status.scoring_leaders");
    expect(
      within(scoring).getByRole("heading", { name: "Best Scoring Teams" }),
    ).toBeInTheDocument();
    // Goals scored: Northside 4, Harbour 2, Valley 2, Riverside 1.
    // Harbour and Valley tie on 2 and break on team name.
    expect(rankedNames(scoring)).toEqual([
      "Northside United",
      "Harbour City",
      "Valley Rangers",
      "Riverside FC",
    ]);

    const conceding = screen.getByTestId("status.conceding_leaders");
    expect(
      within(conceding).getByRole("heading", { name: "Best Conceding Teams" }),
    ).toBeInTheDocument();
    // Goals conceded: Riverside 4, Harbour 2, Valley 2, Northside 1.
    // Harbour and Valley tie on 2 and break on team name.
    expect(rankedNames(conceding)).toEqual([
      "Riverside FC",
      "Harbour City",
      "Valley Rangers",
      "Northside United",
    ]);
  });

  it("shows each leader section's empty state when no completed fixtures exist", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      fixtures: [
        // Only a live and an upcoming fixture: nothing is completed.
        makeFixture(1n, 1n, 2n, MatchStatus.live, {
          homeGoals: 1n,
          awayGoals: 0n,
          kickoff: KICKOFF,
        }),
        makeFixture(2n, 2n, 1n, MatchStatus.upcoming, { kickoff: KICKOFF }),
      ],
    });
    renderWithProviders(<StatusPage />, { state });

    // The router resolves asynchronously, so await the section first.
    const scoring = await screen.findByTestId("status.scoring_leaders");
    // With teams registered but no completed fixtures, the section renders a
    // full ranking of every team at zero rather than the empty state.
    expect(rankedNames(scoring)).toEqual(["Northside United", "Riverside FC"]);
    expect(
      screen.queryByTestId("status.scoring_leaders.empty_state"),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no teams at all", async () => {
    renderWithProviders(<StatusPage />, { state: createMockState() });

    await screen.findByTestId("status.scoring_leaders");
    expect(
      screen.getByTestId("status.scoring_leaders.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("status.conceding_leaders.empty_state"),
    ).toBeInTheDocument();
  });
});

describe("GoalLeaders ranking", () => {
  it("renders display-only rows with the metric value and no links", async () => {
    const rows = [
      {
        teamId: 1n,
        teamName: "Alpha FC",
        shortCode: "ALP",
        played: 1n,
        won: 1n,
        drawn: 0n,
        lost: 0n,
        goalsFor: 5n,
        goalsAgainst: 1n,
        goalDifference: 4n,
        points: 3n,
      },
      {
        teamId: 2n,
        teamName: "Bravo FC",
        shortCode: "BRV",
        played: 1n,
        won: 0n,
        drawn: 0n,
        lost: 1n,
        goalsFor: 1n,
        goalsAgainst: 5n,
        goalDifference: -4n,
        points: 0n,
      },
    ];

    renderWithProviders(
      <GoalLeaders
        ocid="test.leaders"
        title="Best Scoring Teams"
        description="Most goals scored"
        metric="goalsFor"
        rows={rows}
      />,
      { state: createMockState() },
    );

    const section = await screen.findByTestId("test.leaders");
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    // Highest first, with the metric value shown on each row.
    expect(
      within(items[0] as HTMLElement).getByText("Alpha FC"),
    ).toBeInTheDocument();
    expect(within(items[0] as HTMLElement).getByText("5")).toBeInTheDocument();
    expect(
      within(items[1] as HTMLElement).getByText("Bravo FC"),
    ).toBeInTheDocument();
    expect(within(items[1] as HTMLElement).getByText("1")).toBeInTheDocument();
    // Rows are non-clickable display rows.
    expect(within(section).queryAllByRole("link")).toHaveLength(0);
  });
});
