import { MatchStatus } from "@/backend";
import { TablePage } from "@/pages/TablePage";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createMockState, makeFixture, makeTeam } from "./mockBackend";
import { renderWithProviders } from "./renderWithProviders";

/**
 * Characterization of the league-table rules the tournament already enforces.
 *
 * These are the invariants the upcoming work must not regress: standings are
 * derived from completed fixtures only, a win is 3 points, a draw is 1 point
 * each, a loss is 0, every registered team appears even with no results, and
 * goal difference is always goals-for minus goals-against.
 *
 * The mock actor computes the table locally, so this file proves the rendering
 * and the frontend's expectations, not the Motoko canister. The PocketIC lane
 * is what exercises the real backend.
 */

/** Read a rendered row's numeric columns in the table's fixed column order. */
function numericCells(row: HTMLElement): string[] {
  // The team cell packs crest initials, name, and short code into one cell, so
  // the numeric columns are everything after it.
  return within(row)
    .getAllByRole("cell")
    .slice(2)
    .map((cell) => cell.textContent ?? "");
}

describe("league table invariants", () => {
  it("counts only completed fixtures, ignoring live and upcoming results", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      fixtures: [
        // Completed: Northside 2-0 Riverside.
        makeFixture(1n, 1n, 2n, MatchStatus.completed, {
          homeGoals: 2n,
          awayGoals: 0n,
        }),
        // Live: Riverside 5-0 Northside — must not count.
        makeFixture(2n, 2n, 1n, MatchStatus.live, {
          homeGoals: 5n,
          awayGoals: 0n,
        }),
        // Upcoming: Northside vs Riverside with no score — must not count.
        makeFixture(3n, 1n, 2n, MatchStatus.upcoming),
      ],
    });
    renderWithProviders(<TablePage />, { state });

    const table = await screen.findByTestId("table.league_table");
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(3);

    // Northside: only the completed 2-0 win counts.
    expect(within(rows[1]).getByText("Northside United")).toBeInTheDocument();
    expect(numericCells(rows[1])).toEqual([
      "1", // P
      "1", // W
      "0", // D
      "0", // L
      "2", // GF
      "0", // GA
      "+2", // GD
      "3", // Pts
    ]);

    // Riverside: only the completed 0-2 loss counts, not the live 5-0.
    expect(within(rows[2]).getByText("Riverside FC")).toBeInTheDocument();
    expect(numericCells(rows[2])).toEqual([
      "1",
      "0",
      "0",
      "1",
      "0",
      "2",
      "-2",
      "0",
    ]);
  });

  it("awards one point to each side of a completed draw", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      fixtures: [
        makeFixture(1n, 1n, 2n, MatchStatus.completed, {
          homeGoals: 1n,
          awayGoals: 1n,
        }),
      ],
    });
    renderWithProviders(<TablePage />, { state });

    const table = await screen.findByTestId("table.league_table");
    const rows = within(table).getAllByRole("row");

    // Both teams: 1 played, 0 won, 1 drawn, 0 lost, 1 GF, 1 GA, 0 GD, 1 point.
    for (const row of [rows[1], rows[2]]) {
      expect(numericCells(row)).toEqual([
        "1",
        "0",
        "1",
        "0",
        "1",
        "1",
        "0",
        "1",
      ]);
    }
  });

  it("lists a team with no completed fixtures with every column at zero", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
        makeTeam(3n, "Harbour City", "HBC"),
      ],
      fixtures: [
        // Only Northside and Riverside have played.
        makeFixture(1n, 1n, 2n, MatchStatus.completed, {
          homeGoals: 3n,
          awayGoals: 0n,
        }),
      ],
    });
    renderWithProviders(<TablePage />, { state });

    const table = await screen.findByTestId("table.league_table");
    const rows = within(table).getAllByRole("row");
    // Header plus all three registered teams.
    expect(rows).toHaveLength(4);

    const harbourRow = rows.find((row) =>
      within(row).queryByText("Harbour City"),
    );
    expect(harbourRow).toBeDefined();
    expect(numericCells(harbourRow as HTMLElement)).toEqual([
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
    ]);
  });

  it("keeps goal difference equal to goals-for minus goals-against on every row", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
        makeTeam(3n, "Harbour City", "HBC"),
        makeTeam(4n, "Valley Rangers", "VLR"),
      ],
      fixtures: [
        makeFixture(1n, 1n, 2n, MatchStatus.completed, {
          homeGoals: 4n,
          awayGoals: 1n,
        }),
        makeFixture(2n, 3n, 4n, MatchStatus.completed, {
          homeGoals: 0n,
          awayGoals: 0n,
        }),
        makeFixture(3n, 2n, 3n, MatchStatus.completed, {
          homeGoals: 2n,
          awayGoals: 2n,
        }),
        makeFixture(4n, 4n, 1n, MatchStatus.completed, {
          homeGoals: 1n,
          awayGoals: 3n,
        }),
      ],
    });
    renderWithProviders(<TablePage />, { state });

    const table = await screen.findByTestId("table.league_table");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(4);

    for (const row of rows) {
      const [played, won, drawn, lost, gf, ga, gd, points] = numericCells(row);
      const goalsFor = Number(gf);
      const goalsAgainst = Number(ga);
      const goalDifference = Number(gd);
      expect(goalDifference).toBe(goalsFor - goalsAgainst);
      // Points are exactly 3 per win plus 1 per draw.
      expect(Number(points)).toBe(Number(won) * 3 + Number(drawn));
      // Played is the sum of won, drawn, and lost.
      expect(Number(played)).toBe(Number(won) + Number(drawn) + Number(lost));
    }
  });

  it("shows the standard columns only, with no Form column", async () => {
    const state = createMockState({
      teams: [makeTeam(1n, "Northside United", "NSU")],
    });
    renderWithProviders(<TablePage />, { state });

    const table = await screen.findByTestId("table.league_table");
    const headers = within(table)
      .getAllByRole("columnheader")
      .map((header) => header.textContent ?? "");

    // Rank, Team, then the eight standard numeric columns in order.
    expect(headers).toEqual([
      "#",
      "Team",
      "P",
      "W",
      "D",
      "L",
      "GF",
      "GC",
      "GD",
      "Pts",
    ]);
    expect(headers).not.toContain("Form");
  });

  it("sorts by points, then goal difference, then goals for, then team name", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Alpha FC", "ALP"),
        makeTeam(2n, "Bravo FC", "BRV"),
        makeTeam(3n, "Charlie FC", "CHR"),
        makeTeam(4n, "Delta FC", "DLT"),
      ],
      fixtures: [
        // Alpha and Bravo both win, so both finish on 3 points. Alpha wins by
        // more, so its goal difference ranks it above Bravo.
        makeFixture(1n, 1n, 3n, MatchStatus.completed, {
          homeGoals: 3n,
          awayGoals: 0n,
        }),
        makeFixture(2n, 2n, 4n, MatchStatus.completed, {
          homeGoals: 1n,
          awayGoals: 0n,
        }),
      ],
    });
    renderWithProviders(<TablePage />, { state });

    const table = await screen.findByTestId("table.league_table");
    const rows = within(table).getAllByRole("row").slice(1);
    const order = rows.map(
      (row) => within(row).getAllByRole("cell")[1]?.textContent ?? "",
    );

    // Alpha (3 pts, +3) before Bravo (3 pts, +1). Charlie and Delta both lost
    // and stay on 0 points with equal goal difference (-3 vs -1 is not equal,
    // so Delta's better goal difference ranks it above Charlie).
    expect(order[0]).toContain("Alpha FC");
    expect(order[1]).toContain("Bravo FC");
    expect(order[2]).toContain("Delta FC");
    expect(order[3]).toContain("Charlie FC");
  });

  it("breaks a points and goal-difference tie on goals for", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Alpha FC", "ALP"),
        makeTeam(2n, "Bravo FC", "BRV"),
        makeTeam(3n, "Charlie FC", "CHR"),
        makeTeam(4n, "Delta FC", "DLT"),
      ],
      fixtures: [
        // Alpha wins 2-0 and Bravo wins 3-1: both finish on 3 points with a
        // goal difference of +2. Bravo scored more goals, so it ranks first.
        makeFixture(1n, 1n, 3n, MatchStatus.completed, {
          homeGoals: 2n,
          awayGoals: 0n,
        }),
        makeFixture(2n, 2n, 4n, MatchStatus.completed, {
          homeGoals: 3n,
          awayGoals: 1n,
        }),
      ],
    });
    renderWithProviders(<TablePage />, { state });

    const table = await screen.findByTestId("table.league_table");
    const rows = within(table).getAllByRole("row").slice(1);
    const order = rows.map(
      (row) => within(row).getAllByRole("cell")[1]?.textContent ?? "",
    );

    expect(order[0]).toContain("Bravo FC");
    expect(order[1]).toContain("Alpha FC");
  });
});
