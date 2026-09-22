import { MatchStatus } from "@/backend";
import { AdminBracketPage } from "@/pages/AdminBracketPage";
import { AdminFixturesPage } from "@/pages/AdminFixturesPage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminTeamsPage } from "@/pages/AdminTeamsPage";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createMockState, makeFixture, makeTeam, makeTie } from "./mockBackend";
import { renderWithProviders } from "./renderWithProviders";

const KICKOFF = 1_700_000_000_000_000_000n;

describe("AdminLoginPage", () => {
  it("signs in with the built-in credentials and navigates to the control room", async () => {
    const user = userEvent.setup();
    const state = createMockState();
    renderWithProviders(<AdminLoginPage />, {
      state,
      initialEntries: ["/admin/login"],
    });

    await user.type(await screen.findByTestId("admin.username_input"), "Midhu");
    await user.type(screen.getByTestId("admin.password_input"), "Midhu@2006");
    await user.click(screen.getByTestId("admin.login_submit_button"));

    // A successful login stores a session token the backend recognises.
    await waitFor(() => {
      expect(state.sessions.size).toBe(1);
    });
    expect(screen.queryByTestId("admin.login_error")).not.toBeInTheDocument();
  });

  it("shows an error and keeps the session empty for wrong credentials", async () => {
    const user = userEvent.setup();
    const state = createMockState();
    renderWithProviders(<AdminLoginPage />, {
      state,
      initialEntries: ["/admin/login"],
    });

    await user.type(await screen.findByTestId("admin.username_input"), "Midhu");
    await user.type(screen.getByTestId("admin.password_input"), "wrong");
    await user.click(screen.getByTestId("admin.login_submit_button"));

    const error = await screen.findByTestId("admin.login_error");
    expect(error).toHaveTextContent("Incorrect username or password.");
    expect(state.sessions.size).toBe(0);
  });
});

describe("AdminTeamsPage", () => {
  it("creates a team and lists it in the roster", async () => {
    const user = userEvent.setup();
    const state = createMockState();
    renderWithProviders(<AdminTeamsPage />, {
      state,
      initialEntries: ["/admin/teams"],
      adminToken: "admin-1",
    });

    await user.type(
      await screen.findByTestId("admin.team_name_input"),
      "Northside United",
    );
    await user.type(screen.getByTestId("admin.team_code_input"), "NSU");
    await user.click(screen.getByTestId("admin.team_submit_button"));

    const item = await screen.findByTestId("admin.team_item.1");
    expect(within(item).getByText("Northside United")).toBeInTheDocument();
    expect(within(item).getByText("NSU")).toBeInTheDocument();
    expect(state.teams).toHaveLength(1);
    expect(state.teams[0]?.name).toBe("Northside United");
  });
});

describe("AdminFixturesPage", () => {
  it("saves a completed result and shows the fixture as completed", async () => {
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
    renderWithProviders(<AdminFixturesPage />, {
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

    await waitFor(() => {
      expect(state.fixtures[0]?.status).toBe(MatchStatus.completed);
    });
    expect(state.fixtures[0]?.homeGoals).toBe(3n);
    expect(state.fixtures[0]?.awayGoals).toBe(1n);
    // The row reflects the saved state.
    expect(within(item).getByText("Full time")).toBeInTheDocument();
  });
});

describe("AdminBracketPage", () => {
  it("records a tie result and advances the winner automatically", async () => {
    const user = userEvent.setup();
    const state = createMockState({
      teams: [
        makeTeam(1n, "Northside United", "NSU"),
        makeTeam(2n, "Riverside FC", "RFC"),
      ],
      ties: [makeTie(1n, "roundOf16" as never, 1n, 1n, 2n)],
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
      "0",
    );
    await user.click(
      within(item).getByTestId("admin.tie_save_result_button.1"),
    );

    await waitFor(() => {
      expect(state.ties[0]?.winnerTeamId).toBe(1n);
    });
    // The winner is surfaced on the tie row.
    expect(
      await within(item).findByText(/Northside United advanced/),
    ).toBeInTheDocument();
  });
});
