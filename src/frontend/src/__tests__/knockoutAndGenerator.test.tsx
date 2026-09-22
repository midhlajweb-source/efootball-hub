import { KnockoutRound, MatchStatus } from "@/backend";
import { AdminBracketPage } from "@/pages/AdminBracketPage";
import { AdminFixturesPage } from "@/pages/AdminFixturesPage";
import { BracketPage } from "@/pages/BracketPage";
import { MatchDetailPage } from "@/pages/MatchDetailPage";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createMockState, makeFixture, makeTeam, makeTie } from "./mockBackend";
import { renderWithProviders } from "./renderWithProviders";

const KICKOFF = 1_700_000_000_000_000_000n;

/**
 * Coverage for the round-robin generator and the penalty-shootout branch of the
 * knockout flow.
 *
 * The actor is the local typed mock in `mockBackend.ts`, so this proves the
 * pages, hooks, and rendering — not the Motoko canister. The PocketIC lane is
 * what calls the real backend.
 */

describe("AdminFixturesPage result recompute", () => {
  it("recomputes the league table when a result is saved and when it is cleared", async () => {
    const user = userEvent.setup();
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      fixtures: [
        makeFixture(1n, 1n, 2n, MatchStatus.upcoming, { kickoff: KICKOFF }),
      ],
    });
    const { actor } = renderWithProviders(<AdminFixturesPage />, {
      state,
      initialEntries: ["/admin/fixtures"],
      adminToken: "admin-1",
    });

    const item = await screen.findByTestId("admin.fixture_item.1");
    await user.type(
      within(item).getByTestId("admin.fixture_home_goals_input.1"),
      "3",
    );
    await user.type(
      within(item).getByTestId("admin.fixture_away_goals_input.1"),
      "1",
    );
    await user.selectOptions(
      within(item).getByTestId("admin.fixture_status_select.1"),
      MatchStatus.completed,
    );
    await user.click(
      within(item).getByTestId("admin.fixture_save_result_button.1"),
    );

    // The table reflects the completed 3-1 win immediately.
    await waitFor(async () => {
      const table = await actor.getLeagueTable();
      const northside = table.find((row) => row.teamId === 1n);
      expect(northside).toMatchObject({
        played: 1n,
        won: 1n,
        goalsFor: 3n,
        goalsAgainst: 1n,
        goalDifference: 2n,
        points: 3n,
      });
    });

    // Clearing the result (back to upcoming) removes it from the table.
    await user.selectOptions(
      within(item).getByTestId("admin.fixture_status_select.1"),
      MatchStatus.upcoming,
    );
    await user.click(
      within(item).getByTestId("admin.fixture_save_result_button.1"),
    );

    await waitFor(async () => {
      const table = await actor.getLeagueTable();
      const northside = table.find((row) => row.teamId === 1n);
      expect(northside).toMatchObject({
        played: 0n,
        won: 0n,
        goalsFor: 0n,
        goalsAgainst: 0n,
        goalDifference: 0n,
        points: 0n,
      });
    });
  });
});

describe("AdminFixturesPage round-robin generator", () => {
  it("generates a complete schedule for every registered team", async () => {
    const user = userEvent.setup();
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
        makeTeam(3n, "Harbour City", "HBC"),
        makeTeam(4n, "Valley Rangers", "VLR"),
      ],
    });
    renderWithProviders(<AdminFixturesPage />, {
      state,
      initialEntries: ["/admin/fixtures"],
      adminToken: "admin-1",
    });

    await user.click(
      await screen.findByTestId("admin.generate_fixtures_button"),
    );

    // Four teams: C(4,2) = 6 fixtures, each pairing exactly once.
    await waitFor(() => {
      expect(state.fixtures).toHaveLength(6);
    });
    const pairings = new Set(
      state.fixtures.map((fixture) => {
        const [a, b] = [fixture.homeTeamId, fixture.awayTeamId].sort((x, y) =>
          x < y ? -1 : x > y ? 1 : 0,
        );
        return `${a.toString()}-${b.toString()}`;
      }),
    );
    expect(pairings.size).toBe(6);
    // Generated fixtures start upcoming with no scores.
    for (const fixture of state.fixtures) {
      expect(fixture.status).toBe(MatchStatus.upcoming);
      expect(fixture.homeGoals).toBeUndefined();
      expect(fixture.awayGoals).toBeUndefined();
    }
  });

  it("warns before replacing existing fixtures and only replaces on confirm", async () => {
    const user = userEvent.setup();
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      fixtures: [
        makeFixture(1n, 1n, 2n, MatchStatus.completed, {
          homeGoals: 3n,
          awayGoals: 1n,
          kickoff: KICKOFF,
        }),
      ],
    });
    renderWithProviders(<AdminFixturesPage />, {
      state,
      initialEntries: ["/admin/fixtures"],
      adminToken: "admin-1",
    });

    await user.click(
      await screen.findByTestId("admin.generate_fixtures_button"),
    );

    // The confirmation appears and nothing has been replaced yet.
    const confirm = await screen.findByTestId("admin.generate_confirm");
    expect(confirm).toHaveTextContent("replace");
    expect(state.fixtures).toHaveLength(1);
    expect(state.fixtures[0]?.status).toBe(MatchStatus.completed);

    // Cancelling leaves the existing fixture untouched.
    await user.click(screen.getByTestId("admin.generate_cancel_button"));
    expect(
      screen.queryByTestId("admin.generate_confirm"),
    ).not.toBeInTheDocument();
    expect(state.fixtures).toHaveLength(1);

    // Confirming replaces the schedule with the generated round-robin.
    await user.click(screen.getByTestId("admin.generate_fixtures_button"));
    await user.click(
      await screen.findByTestId("admin.generate_confirm_button"),
    );
    await waitFor(() => {
      expect(state.fixtures).toHaveLength(1);
    });
    expect(state.fixtures[0]?.status).toBe(MatchStatus.upcoming);
    expect(state.fixtures[0]?.homeGoals).toBeUndefined();
  });
});

describe("AdminBracketPage penalty shootout", () => {
  it("records a level tie's shootout score and advances the penalty winner", async () => {
    const user = userEvent.setup();
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      ties: [
        makeTie(1n, KnockoutRound.roundOf16, 0n, 1n, 2n),
        makeTie(2n, KnockoutRound.quarterFinal, 0n, undefined, undefined),
      ],
    });
    renderWithProviders(<AdminBracketPage />, {
      state,
      initialEntries: ["/admin/knockout"],
      adminToken: "admin-1",
    });

    // The page numbers ties per round, so scope to the Round of 16 section.
    const roundOf16 = (
      await screen.findByRole("heading", { name: "Round of 16" })
    ).closest("section") as HTMLElement;
    const item = within(roundOf16).getByTestId("admin.tie_item.1");
    await user.type(
      within(item).getByTestId("admin.tie_home_goals_input.1"),
      "1",
    );
    await user.type(
      within(item).getByTestId("admin.tie_away_goals_input.1"),
      "1",
    );

    // A level normal-time score reveals the penalty inputs.
    const homePens = await within(item).findByTestId(
      "admin.tie_home_penalties_input.1",
    );
    await user.type(homePens, "3");
    await user.type(
      within(item).getByTestId("admin.tie_away_penalties_input.1"),
      "4",
    );
    await user.click(
      within(item).getByTestId("admin.tie_save_result_button.1"),
    );

    await waitFor(() => {
      expect(state.ties[0]?.winnerTeamId).toBe(2n);
    });
    expect(state.ties[0]?.homePenalties).toBe(3n);
    expect(state.ties[0]?.awayPenalties).toBe(4n);
    // The shootout winner fills the next round's home slot.
    expect(state.ties[1]?.homeTeamId).toBe(2n);
    expect(
      await within(item).findByText(/Riverside FC advanced/),
    ).toBeInTheDocument();
  });

  it("rejects a shootout that ends level", async () => {
    const user = userEvent.setup();
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      ties: [makeTie(1n, KnockoutRound.roundOf16, 0n, 1n, 2n)],
    });
    renderWithProviders(<AdminBracketPage />, {
      state,
      initialEntries: ["/admin/knockout"],
      adminToken: "admin-1",
    });

    const item = await screen.findByTestId("admin.tie_item.1");
    await user.type(
      within(item).getByTestId("admin.tie_home_goals_input.1"),
      "2",
    );
    await user.type(
      within(item).getByTestId("admin.tie_away_goals_input.1"),
      "2",
    );
    await user.type(
      await within(item).findByTestId("admin.tie_home_penalties_input.1"),
      "4",
    );
    await user.type(
      within(item).getByTestId("admin.tie_away_penalties_input.1"),
      "4",
    );
    await user.click(
      within(item).getByTestId("admin.tie_save_result_button.1"),
    );

    // The tie is not saved and no winner is decided.
    expect(state.ties[0]?.winnerTeamId).toBeUndefined();
    expect(state.ties[0]?.homeGoals).toBeUndefined();
  });
});

describe("BracketPage penalty display", () => {
  it("shows the shootout score and marks the penalty winner as advanced", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      ties: [
        makeTie(1n, KnockoutRound.roundOf16, 0n, 1n, 2n, {
          homeGoals: 1n,
          awayGoals: 1n,
          homePenalties: 3n,
          awayPenalties: 4n,
          winnerTeamId: 2n,
        }),
      ],
    });
    renderWithProviders(<BracketPage />, { state });

    const roundOf16 = await screen.findByTestId("bracket.round.1");
    const tie = within(roundOf16).getByTestId("bracket.tie.1");
    // The normal-time score and the shootout score are both shown.
    expect(tie).toHaveTextContent("1");
    expect(tie).toHaveTextContent("(3-4 pens)");
    expect(within(tie).getByTestId("bracket.tie_advanced.1")).toHaveTextContent(
      "Advanced on pens",
    );
  });
});

describe("MatchDetailPage penalty display", () => {
  it("shows the shootout score alongside the normal-time score", async () => {
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      fixtures: [
        makeFixture(7n, 1n, 2n, MatchStatus.completed, {
          homeGoals: 1n,
          awayGoals: 1n,
          kickoff: KICKOFF,
        }),
      ],
      ties: [
        makeTie(1n, KnockoutRound.roundOf16, 0n, 1n, 2n, {
          homeGoals: 1n,
          awayGoals: 1n,
          homePenalties: 3n,
          awayPenalties: 4n,
          winnerTeamId: 2n,
        }),
      ],
    });
    renderWithProviders(<MatchDetailPage />, {
      state,
      initialEntries: ["/public/match/7"],
    });

    const scoreboard = await screen.findByTestId("match.scoreboard");
    expect(scoreboard).toHaveTextContent("1:1");
    expect(screen.getByTestId("match.penalties")).toHaveTextContent(
      "(3-4 pens)",
    );
    expect(screen.getByTestId("match.advanced_team")).toHaveTextContent(
      "Riverside FC advanced on penalties",
    );
  });
});
