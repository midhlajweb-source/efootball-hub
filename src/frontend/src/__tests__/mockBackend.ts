import type {
  AdminSession,
  BracketRoundView,
  Fixture,
  KnockoutRound,
  KnockoutTie,
  LeagueRow,
  MatchStatus,
  MatchView,
  Team,
  TournamentState,
} from "@/backend";
import { KnockoutRound as Round, MatchStatus as Status } from "@/backend";

/**
 * A typed, in-memory stand-in for the generated `Backend` actor. It implements
 * the same public surface the app's hooks call, so a component test exercises
 * the real hooks, query keys, and rendering against deterministic data.
 *
 * This is a local mock: it proves nothing about the Motoko canister. The
 * PocketIC lane is what calls the real backend.
 */
export interface MockBackendState {
  tournamentName: string;
  stageLabel: string;
  teams: Team[];
  fixtures: Fixture[];
  ties: KnockoutTie[];
  sessions: Map<string, AdminSession>;
  nextTeamId: bigint;
  nextFixtureId: bigint;
  nextTieId: bigint;
  nextSessionId: bigint;
}

export function createMockState(
  overrides: Partial<MockBackendState> = {},
): MockBackendState {
  return {
    tournamentName: "eFootball Cup",
    stageLabel: "League Stage — Matchday 1",
    teams: [],
    fixtures: [],
    ties: [],
    sessions: new Map(),
    nextTeamId: 1n,
    nextFixtureId: 1n,
    nextTieId: 1n,
    nextSessionId: 1n,
    ...overrides,
  };
}

export function makeTeam(id: bigint, name: string, shortCode: string): Team {
  return { id, name, shortCode };
}

export function makeFixture(
  id: bigint,
  homeTeamId: bigint,
  awayTeamId: bigint,
  status: MatchStatus,
  options: {
    homeGoals?: bigint;
    awayGoals?: bigint;
    matchday?: bigint;
    kickoff?: bigint;
  } = {},
): Fixture {
  return {
    id,
    homeTeamId,
    awayTeamId,
    matchday: options.matchday ?? 1n,
    kickoff: options.kickoff ?? 1_700_000_000_000_000_000n,
    homeGoals: options.homeGoals,
    awayGoals: options.awayGoals,
    status,
  };
}

export function makeTie(
  id: bigint,
  round: KnockoutRound,
  slot: bigint,
  homeTeamId: bigint | undefined,
  awayTeamId: bigint | undefined,
  options: {
    homeGoals?: bigint;
    awayGoals?: bigint;
    homePenalties?: bigint;
    awayPenalties?: bigint;
    winnerTeamId?: bigint;
  } = {},
): KnockoutTie {
  return {
    id,
    round,
    slot,
    homeTeamId,
    awayTeamId,
    homeGoals: options.homeGoals,
    awayGoals: options.awayGoals,
    homePenalties: options.homePenalties,
    awayPenalties: options.awayPenalties,
    winnerTeamId: options.winnerTeamId,
  };
}

function teamName(state: MockBackendState, id: bigint): string {
  return state.teams.find((team) => team.id === id)?.name ?? "Unknown Team";
}

function toMatchView(state: MockBackendState, fixture: Fixture): MatchView {
  return {
    id: fixture.id,
    homeTeamName: teamName(state, fixture.homeTeamId),
    awayTeamName: teamName(state, fixture.awayTeamId),
    homeGoals: fixture.homeGoals,
    awayGoals: fixture.awayGoals,
    matchday: fixture.matchday,
    kickoff: fixture.kickoff,
    status: fixture.status,
  };
}

function toTieView(state: MockBackendState, tie: KnockoutTie) {
  return {
    id: tie.id,
    round: tie.round,
    slot: tie.slot,
    homeTeamName:
      tie.homeTeamId === undefined
        ? undefined
        : teamName(state, tie.homeTeamId),
    awayTeamName:
      tie.awayTeamId === undefined
        ? undefined
        : teamName(state, tie.awayTeamId),
    homeGoals: tie.homeGoals,
    awayGoals: tie.awayGoals,
    homePenalties: tie.homePenalties,
    awayPenalties: tie.awayPenalties,
    winnerTeamName:
      tie.winnerTeamId === undefined
        ? undefined
        : teamName(state, tie.winnerTeamId),
  };
}

function leagueRows(state: MockBackendState): LeagueRow[] {
  const rows: LeagueRow[] = state.teams.map((team) => {
    let played = 0n;
    let won = 0n;
    let drawn = 0n;
    let lost = 0n;
    let goalsFor = 0n;
    let goalsAgainst = 0n;
    for (const fixture of state.fixtures) {
      if (fixture.status !== Status.completed) continue;
      if (fixture.homeGoals === undefined || fixture.awayGoals === undefined) {
        continue;
      }
      const isHome = fixture.homeTeamId === team.id;
      const isAway = fixture.awayTeamId === team.id;
      if (!isHome && !isAway) continue;
      const scored = isHome ? fixture.homeGoals : fixture.awayGoals;
      const conceded = isHome ? fixture.awayGoals : fixture.homeGoals;
      played += 1n;
      goalsFor += scored;
      goalsAgainst += conceded;
      if (scored > conceded) won += 1n;
      else if (scored === conceded) drawn += 1n;
      else lost += 1n;
    }
    return {
      teamId: team.id,
      teamName: team.name,
      shortCode: team.shortCode,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: won * 3n + drawn,
    };
  });
  return rows.sort((a, b) => {
    if (a.points !== b.points) return a.points > b.points ? -1 : 1;
    if (a.goalDifference !== b.goalDifference) {
      return a.goalDifference > b.goalDifference ? -1 : 1;
    }
    if (a.goalsFor !== b.goalsFor) return a.goalsFor > b.goalsFor ? -1 : 1;
    return a.teamName.localeCompare(b.teamName);
  });
}

const ROUND_ORDER: KnockoutRound[] = [
  Round.roundOf16,
  Round.quarterFinal,
  Round.semiFinal,
  Round.final,
];

function nextRound(round: KnockoutRound): KnockoutRound | undefined {
  switch (round) {
    case Round.roundOf16:
      return Round.quarterFinal;
    case Round.quarterFinal:
      return Round.semiFinal;
    case Round.semiFinal:
      return Round.final;
    default:
      return undefined;
  }
}

/**
 * Mirrors the canister's `decideWinner`: normal-time goals decide first, then
 * the penalty shootout when the normal-time score is level. A tie level on both
 * (or missing a score) stays undecided.
 */
function decideWinner(
  tie: KnockoutTie,
  homeGoals: bigint | null,
  awayGoals: bigint | null,
  homePenalties: bigint | null,
  awayPenalties: bigint | null,
): bigint | undefined {
  if (homeGoals === null || awayGoals === null) return undefined;
  if (homeGoals > awayGoals) return tie.homeTeamId;
  if (awayGoals > homeGoals) return tie.awayTeamId;
  if (homePenalties === null || awayPenalties === null) return undefined;
  if (homePenalties > awayPenalties) return tie.homeTeamId;
  if (awayPenalties > homePenalties) return tie.awayTeamId;
  return undefined;
}

/**
 * Mirrors the canister's `advanceWinner`: a feeder owns one side of the next
 * round's tie at `slot / 2` — even slots fill home, odd slots fill away — and
 * only its own side is written, so the sibling feeder's winner is preserved.
 */
function advanceWinner(state: MockBackendState, tie: KnockoutTie): void {
  const next = nextRound(tie.round);
  if (next === undefined) return;
  const targetSlot = tie.slot / 2n;
  const isHome = tie.slot % 2n === 0n;
  const target = state.ties.find(
    (candidate) => candidate.round === next && candidate.slot === targetSlot,
  );
  if (!target) return;
  if (isHome) {
    target.homeTeamId = tie.winnerTeamId;
  } else {
    target.awayTeamId = tie.winnerTeamId;
  }
}

/**
 * Mirrors the canister's circle-method round-robin generator: every unordered
 * pairing meets once, home/away sides alternate by matchday, and existing
 * fixtures are replaced. Generated fixtures start upcoming with no scores.
 */
function generateRoundRobin(state: MockBackendState): Fixture[] {
  const teamIds = state.teams
    .map((team) => team.id)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  if (teamIds.length < 2) return [];

  const hasBye = teamIds.length % 2 === 1;
  const slotCount = hasBye ? teamIds.length + 1 : teamIds.length;
  let slots: (bigint | undefined)[] = Array.from(
    { length: slotCount },
    (_, i) => (i < teamIds.length ? teamIds[i] : undefined),
  );

  const roundCount = slotCount - 1;
  const half = slotCount / 2;
  state.fixtures = [];

  for (let round = 0; round < roundCount; round += 1) {
    const matchday = BigInt(round + 1);
    for (let i = 0; i < half; i += 1) {
      const first = slots[i];
      const second = slots[slotCount - 1 - i];
      if (first !== undefined && second !== undefined) {
        const [home, away] =
          round % 2 === 0 ? [first, second] : [second, first];
        const fixture = makeFixture(
          state.nextFixtureId,
          home,
          away,
          Status.upcoming,
          { matchday },
        );
        state.nextFixtureId += 1n;
        state.fixtures.push(fixture);
      }
    }
    const previous = slots;
    const rotated: (bigint | undefined)[] = [previous[0]];
    rotated.push(previous[slotCount - 1]);
    for (let j = 1; j < slotCount - 1; j += 1) {
      rotated.push(previous[j]);
    }
    slots = rotated;
  }

  return [...state.fixtures];
}

function bracket(state: MockBackendState): BracketRoundView[] {
  return ROUND_ORDER.map((round) => ({
    round,
    ties: state.ties
      .filter((tie) => tie.round === round)
      .sort((a, b) => (a.slot < b.slot ? -1 : a.slot > b.slot ? 1 : 0))
      .map((tie) => toTieView(state, tie)),
  }));
}

/**
 * The mock actor. Every method mirrors the generated `Backend` signature the
 * hooks call, and mutations update `state` so a re-read observes the change.
 */
export function createMockActor(state: MockBackendState) {
  return {
    getTournamentState: async (): Promise<TournamentState> => ({
      tournamentName: state.tournamentName,
      stageLabel: state.stageLabel,
    }),
    listTeams: async (): Promise<Team[]> => [...state.teams],
    listFixtures: async (): Promise<Fixture[]> => [...state.fixtures],
    listKnockoutTies: async (): Promise<KnockoutTie[]> => [...state.ties],
    getLeagueTable: async (): Promise<LeagueRow[]> => leagueRows(state),
    getBracket: async (): Promise<BracketRoundView[]> => bracket(state),
    getMatch: async (id: bigint): Promise<MatchView | null> => {
      const fixture = state.fixtures.find((f) => f.id === id);
      return fixture ? toMatchView(state, fixture) : null;
    },
    getStatusMatches: async (): Promise<{
      upcoming: MatchView[];
      live: MatchView[];
      completed: MatchView[];
    }> => {
      const views = state.fixtures.map((f) => toMatchView(state, f));
      return {
        upcoming: views.filter((m) => m.status === Status.upcoming),
        live: views.filter((m) => m.status === Status.live),
        completed: views.filter((m) => m.status === Status.completed),
      };
    },
    adminLogin: async (
      username: string,
      password: string,
    ): Promise<AdminSession | null> => {
      if (username !== "Midhu" || password !== "Midhu@2006") return null;
      const token = `admin-${state.nextSessionId.toString()}`;
      state.nextSessionId += 1n;
      const session: AdminSession = { token, username };
      state.sessions.set(token, session);
      return session;
    },
    adminLogout: async (token: string): Promise<boolean> =>
      state.sessions.delete(token),
    isAdminSession: async (token: string): Promise<boolean> =>
      state.sessions.has(token),
    setStageLabel: async (token: string, stageLabel: string) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      state.stageLabel = stageLabel;
      return { __kind__: "ok" as const, ok: null };
    },
    createTeam: async (
      token: string,
      name: string,
      shortCode: string,
      crestUrl: string | null,
    ) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      const team: Team = {
        id: state.nextTeamId,
        name,
        shortCode,
        crestUrl: crestUrl ?? undefined,
      };
      state.nextTeamId += 1n;
      state.teams.push(team);
      return { __kind__: "ok" as const, ok: team };
    },
    updateTeam: async (
      token: string,
      id: bigint,
      name: string,
      shortCode: string,
      crestUrl: string | null,
    ) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      const team = state.teams.find((t) => t.id === id);
      if (!team) {
        return {
          __kind__: "err" as const,
          err: { __kind__: "notFound" as const, notFound: null },
        };
      }
      team.name = name;
      team.shortCode = shortCode;
      team.crestUrl = crestUrl ?? undefined;
      return { __kind__: "ok" as const, ok: team };
    },
    deleteTeam: async (token: string, id: bigint) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      state.teams = state.teams.filter((t) => t.id !== id);
      return { __kind__: "ok" as const, ok: null };
    },
    createFixture: async (
      token: string,
      homeTeamId: bigint,
      awayTeamId: bigint,
      matchday: bigint,
      kickoff: bigint,
    ) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      const fixture = makeFixture(
        state.nextFixtureId,
        homeTeamId,
        awayTeamId,
        Status.upcoming,
        { matchday, kickoff },
      );
      state.nextFixtureId += 1n;
      state.fixtures.push(fixture);
      return { __kind__: "ok" as const, ok: fixture };
    },
    updateFixture: async (
      token: string,
      id: bigint,
      homeTeamId: bigint,
      awayTeamId: bigint,
      matchday: bigint,
      kickoff: bigint,
    ) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      const fixture = state.fixtures.find((f) => f.id === id);
      if (!fixture) {
        return {
          __kind__: "err" as const,
          err: { __kind__: "notFound" as const, notFound: null },
        };
      }
      fixture.homeTeamId = homeTeamId;
      fixture.awayTeamId = awayTeamId;
      fixture.matchday = matchday;
      fixture.kickoff = kickoff;
      return { __kind__: "ok" as const, ok: fixture };
    },
    deleteFixture: async (token: string, id: bigint) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      state.fixtures = state.fixtures.filter((f) => f.id !== id);
      return { __kind__: "ok" as const, ok: null };
    },
    setFixtureResult: async (
      token: string,
      id: bigint,
      homeGoals: bigint | null,
      awayGoals: bigint | null,
      status: MatchStatus,
    ) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      const fixture = state.fixtures.find((f) => f.id === id);
      if (!fixture) {
        return {
          __kind__: "err" as const,
          err: { __kind__: "notFound" as const, notFound: null },
        };
      }
      fixture.homeGoals = homeGoals ?? undefined;
      fixture.awayGoals = awayGoals ?? undefined;
      fixture.status = status;
      return { __kind__: "ok" as const, ok: fixture };
    },
    generateRoundRobinFixtures: async (token: string) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      return { __kind__: "ok" as const, ok: generateRoundRobin(state) };
    },
    createKnockoutTie: async (
      token: string,
      round: KnockoutRound,
      slot: bigint,
      homeTeamId: bigint | null,
      awayTeamId: bigint | null,
    ) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      const tie = makeTie(
        state.nextTieId,
        round,
        slot,
        homeTeamId ?? undefined,
        awayTeamId ?? undefined,
      );
      state.nextTieId += 1n;
      state.ties.push(tie);
      return { __kind__: "ok" as const, ok: tie };
    },
    setKnockoutResult: async (
      token: string,
      id: bigint,
      homeGoals: bigint | null,
      awayGoals: bigint | null,
      homePenalties: bigint | null,
      awayPenalties: bigint | null,
    ) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      const tie = state.ties.find((t) => t.id === id);
      if (!tie) {
        return {
          __kind__: "err" as const,
          err: { __kind__: "notFound" as const, notFound: null },
        };
      }
      tie.homeGoals = homeGoals ?? undefined;
      tie.awayGoals = awayGoals ?? undefined;
      tie.homePenalties = homePenalties ?? undefined;
      tie.awayPenalties = awayPenalties ?? undefined;
      tie.winnerTeamId = decideWinner(
        tie,
        homeGoals,
        awayGoals,
        homePenalties,
        awayPenalties,
      );
      advanceWinner(state, tie);
      return { __kind__: "ok" as const, ok: tie };
    },
    deleteKnockoutTie: async (token: string, id: bigint) => {
      if (!state.sessions.has(token)) {
        return {
          __kind__: "err" as const,
          err: {
            __kind__: "notAuthenticated" as const,
            notAuthenticated: null,
          },
        };
      }
      state.ties = state.ties.filter((t) => t.id !== id);
      return { __kind__: "ok" as const, ok: null };
    },
  };
}

export type MockActor = ReturnType<typeof createMockActor>;
