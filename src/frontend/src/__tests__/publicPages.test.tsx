import { MatchStatus } from "@/backend";
import { BracketPage } from "@/pages/BracketPage";
import { HomePage } from "@/pages/HomePage";
import { MatchDetailPage } from "@/pages/MatchDetailPage";
import { StatusPage } from "@/pages/StatusPage";
import { TablePage } from "@/pages/TablePage";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createMockState, makeFixture, makeTeam, makeTie } from "./mockBackend";
import { renderWithProviders } from "./renderWithProviders";

const KICKOFF = 1_700_000_000_000_000_000n;

describe("HomePage", () => {
  it("shows the tournament name, current stage, and quick links", async () => {
    const state = createMockState({
      tournamentName: "Midhu Champions Cup",
      stageLabel: "Knockout — Semi Finals",
    });
    renderWithProviders(<HomePage />, { state });

    expect(
      await screen.findByRole("heading", { name: "Midhu Champions Cup" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("home.stage_label")).toHaveTextContent(
      "Knockout — Semi Finals",
    );

    const statusLink = screen.getByTestId("home.quick_link.match_status");
    const tableLink = screen.getByTestId("home.quick_link.league_table");
    const bracketLink = screen.getByTestId("home.quick_link.knockout_bracket");
    expect(statusLink).toHaveAttribute("href", "/status");
    expect(tableLink).toHaveAttribute("href", "/table");
    expect(bracketLink).toHaveAttribute("href", "/bracket");
  });

  it("renders an empty state when no fixtures are scheduled", async () => {
    renderWithProviders(<HomePage />, { state: createMockState() });
    expect(await screen.findByTestId("home.empty_state")).toBeInTheDocument();
  });
});

describe("StatusPage", () => {
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
    // The section header also renders a match-count badge, so read the score
    // from the match row rather than the whole section.
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
  });

  it("shows an empty state when there are no matches", async () => {
    renderWithProviders(<StatusPage />, { state: createMockState() });
    expect(await screen.findByTestId("empty_state")).toBeInTheDocument();
  });
});

describe("TablePage", () => {
  it("renders the ranked table with played/won/drawn/lost/GF/GA columns", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
        makeTeam(3n, "Harbour City", "HBC"),
      ],
      fixtures: [
        // Northside beat Riverside 3-0.
        makeFixture(1n, 1n, 2n, MatchStatus.completed, {
          homeGoals: 3n,
          awayGoals: 0n,
        }),
        // Riverside beat Harbour 2-1.
        makeFixture(2n, 2n, 3n, MatchStatus.completed, {
          homeGoals: 2n,
          awayGoals: 1n,
        }),
      ],
    });
    renderWithProviders(<TablePage />, { state });

    const table = await screen.findByTestId("table.league_table");
    const rows = within(table).getAllByRole("row");
    // Header row plus three team rows.
    expect(rows).toHaveLength(4);

    // The team cell packs the crest initials, name, and short code into one
    // cell, so assert the identity via text and the numeric columns by index.
    const firstRow = within(rows[1]);
    expect(firstRow.getByText("Northside United")).toBeInTheDocument();
    expect(firstRow.getByText("NSU")).toBeInTheDocument();
    // P W D L GF GA GD Pts for Northside: 1 1 0 0 3 0 +3 3
    const firstCells = firstRow.getAllByRole("cell");
    expect(firstCells.map((cell) => cell.textContent)).toEqual([
      "1",
      "NSNorthside UnitedNSU",
      "1",
      "1",
      "0",
      "0",
      "3",
      "0",
      "+3",
      "3",
    ]);

    // Riverside: 2 played, 1 won, 1 lost, 2 GF, 4 GA, -2 GD, 3 pts.
    const secondRow = within(rows[2]);
    expect(secondRow.getByText("Riverside FC")).toBeInTheDocument();
    const secondCells = secondRow.getAllByRole("cell");
    expect(secondCells.map((cell) => cell.textContent)).toEqual([
      "2",
      "RFRiverside FCRFC",
      "2",
      "1",
      "0",
      "1",
      "2",
      "4",
      "-2",
      "3",
    ]);

    // Harbour: 1 played, 0 won, 1 lost, 1 GF, 2 GA, -1 GD, 0 pts.
    const thirdRow = within(rows[3]);
    expect(thirdRow.getByText("Harbour City")).toBeInTheDocument();
    const thirdCells = thirdRow.getAllByRole("cell");
    expect(thirdCells.map((cell) => cell.textContent)).toEqual([
      "3",
      "HBHarbour CityHBC",
      "1",
      "0",
      "0",
      "1",
      "1",
      "2",
      "-1",
      "0",
    ]);
  });

  it("shows an empty state before any results are entered", async () => {
    renderWithProviders(<TablePage />, { state: createMockState() });
    expect(await screen.findByTestId("empty_state")).toBeInTheDocument();
  });
});

describe("BracketPage", () => {
  it("renders rounds as a connected bracket with team names and scores", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
        makeTeam(3n, "Harbour City", "HBC"),
        makeTeam(4n, "Valley Rangers", "VLR"),
      ],
      ties: [
        makeTie(1n, "roundOf16" as never, 1n, 1n, 2n, {
          homeGoals: 2n,
          awayGoals: 1n,
          winnerTeamId: 1n,
        }),
        makeTie(2n, "quarterFinal" as never, 1n, 1n, undefined),
      ],
    });
    renderWithProviders(<BracketPage />, { state });

    const roundOf16 = await screen.findByTestId("bracket.round.1");
    expect(within(roundOf16).getByText("Round of 16")).toBeInTheDocument();
    expect(within(roundOf16).getByText("Northside United")).toBeInTheDocument();
    expect(within(roundOf16).getByText("Riverside FC")).toBeInTheDocument();
    expect(within(roundOf16).getByText("Advanced")).toBeInTheDocument();

    const quarterFinal = screen.getByTestId("bracket.round.2");
    expect(
      within(quarterFinal).getByText("Quarter Finals"),
    ).toBeInTheDocument();
    // The winner has advanced into the next round's home slot.
    expect(
      within(quarterFinal).getByText("Northside United"),
    ).toBeInTheDocument();
    expect(within(quarterFinal).getByText("To be decided")).toBeInTheDocument();
  });

  it("shows an empty state when no ties are drawn", async () => {
    renderWithProviders(<BracketPage />, { state: createMockState() });
    expect(await screen.findByTestId("empty_state")).toBeInTheDocument();
  });
});

describe("MatchDetailPage", () => {
  it("shows both teams, the score, matchday, and kickoff", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      fixtures: [
        makeFixture(7n, 1n, 2n, MatchStatus.completed, {
          homeGoals: 4n,
          awayGoals: 2n,
          matchday: 3n,
          kickoff: KICKOFF,
        }),
      ],
    });
    renderWithProviders(<MatchDetailPage />, {
      state,
      initialEntries: ["/public/match/7"],
    });

    expect(
      await screen.findByRole("heading", {
        name: "Northside United vs Riverside FC",
      }),
    ).toBeInTheDocument();
    const scoreboard = screen.getByTestId("match.scoreboard");
    expect(
      within(scoreboard).getByText("Northside United"),
    ).toBeInTheDocument();
    expect(within(scoreboard).getByText("Riverside FC")).toBeInTheDocument();
    // The score renders as a single `4:2` node, so match on its text content.
    expect(scoreboard).toHaveTextContent("4:2");
    expect(screen.getByText("Matchday 3")).toBeInTheDocument();
  });
});
