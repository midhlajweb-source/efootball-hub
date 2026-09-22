import { PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * The PocketIC backend lane for the tournament canister.
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose public methods are all `Debug.todo()` stubs. This file installs the
 * app's own compiled wasm into the platform's PocketIC replica and calls the
 * real public API, which is the only thing that can catch a stubbed or trapping
 * backend.
 *
 * It speaks the agent-js declarations' shapes, not the TypeScript wrapper's:
 * `Nat`/`Int` are `bigint`, `?T` is `[] | [T]`, a variant is `{ name: null }`,
 * and a unit reply decodes to `null`.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far; a failed
  // `PocketIc.create` otherwise buries the real error under a TypeError.
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  await expect(actor.getTournamentState()).resolves.toEqual({
    tournamentName: "eFootball Tournament",
    stageLabel: "League Stage",
  });
  await expect(actor.listTeams()).resolves.toEqual([]);
  await expect(actor.listFixtures()).resolves.toEqual([]);
  await expect(actor.listKnockoutTies()).resolves.toEqual([]);
  await expect(actor.getLeagueTable()).resolves.toEqual([]);
  await expect(actor.getStatusMatches()).resolves.toEqual({
    upcoming: [],
    live: [],
    completed: [],
  });
  await expect(actor.getMatch(1n)).resolves.toEqual([]);
});

it("rejects a wrong admin password and accepts the built-in credentials", async () => {
  await expect(actor.adminLogin("Midhu", "wrong")).resolves.toEqual([]);

  const session = await actor.adminLogin("Midhu", "Midhu@2006");
  expect(session).toHaveLength(1);
  const token = session[0]?.token ?? "";
  expect(token).not.toBe("");
  await expect(actor.isAdminSession(token)).resolves.toBe(true);
  await expect(actor.isAdminSession("not-a-token")).resolves.toBe(false);
});

it("refuses admin mutations without a valid session", async () => {
  await expect(actor.createTeam("bogus", "Ghost FC", "GFC", [])).resolves.toEqual({
    err: { notAuthenticated: null },
  });
  await expect(actor.setStageLabel("bogus", "Hacked")).resolves.toEqual({
    err: { notAuthenticated: null },
  });
});

it("round-trips a team, a fixture, and a result into the league table", async () => {
  const session = await actor.adminLogin("Midhu", "Midhu@2006");
  const token = session[0]?.token ?? "";

  const home = await actor.createTeam(token, "Northside United", "NSU", []);
  const away = await actor.createTeam(token, "Riverside FC", "RFC", []);
  expect(home).toMatchObject({ ok: { name: "Northside United" } });
  expect(away).toMatchObject({ ok: { name: "Riverside FC" } });
  const homeId = home.ok.id;
  const awayId = away.ok.id;

  const created = await actor.createFixture(
    token,
    homeId,
    awayId,
    1n,
    1_700_000_000_000_000_000n,
  );
  expect(created).toMatchObject({ ok: { status: { upcoming: null } } });
  const fixtureId = created.ok.id;

  await expect(
    actor.setFixtureResult(token, fixtureId, [3n], [1n], { completed: null }),
  ).resolves.toMatchObject({ ok: { homeGoals: [3n], awayGoals: [1n] } });

  const table = await actor.getLeagueTable();
  const northside = table.find((row) => row.teamId === homeId);
  const riverside = table.find((row) => row.teamId === awayId);
  expect(northside).toMatchObject({
    played: 1n,
    won: 1n,
    drawn: 0n,
    lost: 0n,
    goalsFor: 3n,
    goalsAgainst: 1n,
    goalDifference: 2n,
    points: 3n,
  });
  expect(riverside).toMatchObject({
    played: 1n,
    won: 0n,
    lost: 1n,
    goalsFor: 1n,
    goalsAgainst: 3n,
    goalDifference: -2n,
    points: 0n,
  });

  // The status view groups the completed fixture under `completed`.
  const status = await actor.getStatusMatches();
  expect(status.completed.map((match) => match.id)).toContain(fixtureId);
  expect(status.upcoming).toEqual([]);
});

it("advances a knockout winner into the next round slot", async () => {
  const session = await actor.adminLogin("Midhu", "Midhu@2006");
  const token = session[0]?.token ?? "";

  const home = await actor.createTeam(token, "Harbour City", "HBC", []);
  const away = await actor.createTeam(token, "Valley Rangers", "VLR", []);
  const homeId = home.ok.id;
  const awayId = away.ok.id;

  // Slot 0 of the Round of 16 feeds the home side of slot 0 in the quarters.
  const tie = await actor.createKnockoutTie(
    token,
    { roundOf16: null },
    0n,
    [homeId],
    [awayId],
  );
  const tieId = tie.ok.id;
  await actor.createKnockoutTie(token, { quarterFinal: null }, 0n, [], []);

  await expect(
    actor.setKnockoutResult(token, tieId, [2n], [0n], [], []),
  ).resolves.toMatchObject({ ok: { winnerTeamId: [homeId] } });

  const bracket = await actor.getBracket();
  const quarterFinal = bracket.find((round) => "quarterFinal" in round.round);
  expect(quarterFinal?.ties[0]?.homeTeamName).toEqual(["Harbour City"]);
  expect(quarterFinal?.ties[0]?.awayTeamName).toEqual([]);
});

it("decides a level knockout tie on penalties and advances the shootout winner", async () => {
  const session = await actor.adminLogin("Midhu", "Midhu@2006");
  const token = session[0]?.token ?? "";

  const home = await actor.createTeam(token, "Pen Home", "PNH", []);
  const away = await actor.createTeam(token, "Pen Away", "PNA", []);
  const homeId = home.ok.id;
  const awayId = away.ok.id;

  // A high, otherwise-unused slot keeps this tie isolated from the ties other
  // tests in this file created on the same shared canister. Slot 9 of the Round
  // of 16 feeds the away side of slot 4 in the quarters.
  const tie = await actor.createKnockoutTie(
    token,
    { roundOf16: null },
    9n,
    [homeId],
    [awayId],
  );
  const tieId = tie.ok.id;
  const target = await actor.createKnockoutTie(
    token,
    { quarterFinal: null },
    4n,
    [],
    [],
  );
  const targetId = target.ok.id;

  // Level after normal time, so the shootout decides. The away side wins it.
  await expect(
    actor.setKnockoutResult(token, tieId, [1n], [1n], [3n], [4n]),
  ).resolves.toMatchObject({
    ok: {
      homeGoals: [1n],
      awayGoals: [1n],
      homePenalties: [3n],
      awayPenalties: [4n],
      winnerTeamId: [awayId],
    },
  });

  const bracket = await actor.getBracket();
  const roundOf16 = bracket.find((round) => "roundOf16" in round.round);
  const tieView = roundOf16?.ties.find((view) => view.id === tieId);
  expect(tieView).toMatchObject({
    homePenalties: [3n],
    awayPenalties: [4n],
    winnerTeamName: ["Pen Away"],
  });

  // The shootout winner fills the away side of the next round's slot 4.
  const quarterFinal = bracket.find((round) => "quarterFinal" in round.round);
  const targetView = quarterFinal?.ties.find((view) => view.id === targetId);
  expect(targetView?.homeTeamName).toEqual([]);
  expect(targetView?.awayTeamName).toEqual(["Pen Away"]);
});

it("recomputes the downstream slot when a completed tie's winner changes", async () => {
  const session = await actor.adminLogin("Midhu", "Midhu@2006");
  const token = session[0]?.token ?? "";

  const home = await actor.createTeam(token, "Change Home", "CHH", []);
  const away = await actor.createTeam(token, "Change Away", "CHA", []);
  const homeId = home.ok.id;
  const awayId = away.ok.id;

  // Slot 10 feeds the home side of quarter-final slot 5, isolated from the
  // ties other tests created on the shared canister.
  const tie = await actor.createKnockoutTie(
    token,
    { roundOf16: null },
    10n,
    [homeId],
    [awayId],
  );
  const tieId = tie.ok.id;
  const target = await actor.createKnockoutTie(
    token,
    { quarterFinal: null },
    5n,
    [],
    [],
  );
  const targetId = target.ok.id;

  // Home wins first, then the result is flipped so the away side wins.
  await actor.setKnockoutResult(token, tieId, [2n], [0n], [], []);
  await expect(
    actor.setKnockoutResult(token, tieId, [0n], [3n], [], []),
  ).resolves.toMatchObject({ ok: { winnerTeamId: [awayId] } });

  const bracket = await actor.getBracket();
  const quarterFinal = bracket.find((round) => "quarterFinal" in round.round);
  const targetView = quarterFinal?.ties.find((view) => view.id === targetId);
  expect(targetView?.homeTeamName).toEqual(["Change Away"]);
});

it("generates a complete round-robin schedule covering every pairing", async () => {
  const session = await actor.adminLogin("Midhu", "Midhu@2006");
  const token = session[0]?.token ?? "";

  const names = ["RR Alpha", "RR Bravo", "RR Charlie", "RR Delta"];
  const ids: bigint[] = [];
  for (const name of names) {
    const created = await actor.createTeam(token, name, name.slice(3, 6), []);
    ids.push(created.ok.id);
  }

  // The generator replaces every fixture and schedules a round-robin over all
  // registered teams, so the expected size is derived from the real roster
  // rather than assumed — this canister is shared with the other tests.
  const roster = await actor.listTeams();
  const teamCount = roster.length;
  const expectedFixtures = (teamCount * (teamCount - 1)) / 2;

  const generated = await actor.generateRoundRobinFixtures(token);
  expect(generated).toMatchObject({ ok: expect.any(Array) });
  const fixtures = generated.ok;
  expect(fixtures).toHaveLength(expectedFixtures);
  // Every generated fixture starts upcoming with no scores.
  for (const fixture of fixtures) {
    expect(fixture.status).toEqual({ upcoming: null });
    expect(fixture.homeGoals).toEqual([]);
    expect(fixture.awayGoals).toEqual([]);
  }

  // Every unordered pairing appears exactly once.
  const pairings = new Set(
    fixtures.map((fixture) => {
      const [a, b] = [fixture.homeTeamId, fixture.awayTeamId].sort((x, y) =>
        x < y ? -1 : x > y ? 1 : 0,
      );
      return `${a.toString()}-${b.toString()}`;
    }),
  );
  expect(pairings.size).toBe(expectedFixtures);
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      expect(pairings.has(`${ids[i].toString()}-${ids[j].toString()}`)).toBe(true);
    }
  }

  // The generated fixtures are the ones the canister now lists.
  const listed = await actor.listFixtures();
  expect(listed).toHaveLength(expectedFixtures);
});

it("counts only completed fixtures in the league table", async () => {
  const session = await actor.adminLogin("Midhu", "Midhu@2006");
  const token = session[0]?.token ?? "";

  const home = await actor.createTeam(token, "Table Home", "TBH", []);
  const away = await actor.createTeam(token, "Table Away", "TBA", []);
  const homeId = home.ok.id;
  const awayId = away.ok.id;

  // A completed 2-0 win for the home side.
  const completed = await actor.createFixture(token, homeId, awayId, 1n, 1n);
  await actor.setFixtureResult(token, completed.ok.id, [2n], [0n], {
    completed: null,
  });

  // A live 5-0 for the away side and an upcoming fixture with no score. Neither
  // may move the table.
  const live = await actor.createFixture(token, awayId, homeId, 1n, 2n);
  await actor.setFixtureResult(token, live.ok.id, [5n], [0n], { live: null });
  await actor.createFixture(token, homeId, awayId, 1n, 3n);

  const table = await actor.getLeagueTable();
  const homeRow = table.find((row) => row.teamId === homeId);
  const awayRow = table.find((row) => row.teamId === awayId);

  expect(homeRow).toMatchObject({
    played: 1n,
    won: 1n,
    drawn: 0n,
    lost: 0n,
    goalsFor: 2n,
    goalsAgainst: 0n,
    goalDifference: 2n,
    points: 3n,
  });
  expect(awayRow).toMatchObject({
    played: 1n,
    won: 0n,
    drawn: 0n,
    lost: 1n,
    goalsFor: 0n,
    goalsAgainst: 2n,
    goalDifference: -2n,
    points: 0n,
  });
});

it("awards one point to each side of a completed draw", async () => {
  const session = await actor.adminLogin("Midhu", "Midhu@2006");
  const token = session[0]?.token ?? "";

  const home = await actor.createTeam(token, "Draw Home", "DRH", []);
  const away = await actor.createTeam(token, "Draw Away", "DRA", []);
  const homeId = home.ok.id;
  const awayId = away.ok.id;

  const fixture = await actor.createFixture(token, homeId, awayId, 1n, 1n);
  await actor.setFixtureResult(token, fixture.ok.id, [1n], [1n], {
    completed: null,
  });

  const table = await actor.getLeagueTable();
  for (const teamId of [homeId, awayId]) {
    expect(table.find((row) => row.teamId === teamId)).toMatchObject({
      played: 1n,
      won: 0n,
      drawn: 1n,
      lost: 0n,
      goalsFor: 1n,
      goalsAgainst: 1n,
      goalDifference: 0n,
      points: 1n,
    });
  }
});

it("lists a team with no completed fixtures with every column at zero", async () => {
  const session = await actor.adminLogin("Midhu", "Midhu@2006");
  const token = session[0]?.token ?? "";

  const idle = await actor.createTeam(token, "Idle Rovers", "IDL", []);
  const idleId = idle.ok.id;

  const table = await actor.getLeagueTable();
  expect(table.find((row) => row.teamId === idleId)).toMatchObject({
    played: 0n,
    won: 0n,
    drawn: 0n,
    lost: 0n,
    goalsFor: 0n,
    goalsAgainst: 0n,
    goalDifference: 0n,
    points: 0n,
  });
});

it("persists the stage label and revokes a session on logout", async () => {
  const session = await actor.adminLogin("Midhu", "Midhu@2006");
  const token = session[0]?.token ?? "";

  await expect(
    actor.setStageLabel(token, "Knockout — Semi Finals"),
  ).resolves.toEqual({ ok: null });
  await expect(actor.getTournamentState()).resolves.toMatchObject({
    stageLabel: "Knockout — Semi Finals",
  });

  await expect(actor.adminLogout(token)).resolves.toBe(true);
  await expect(actor.isAdminSession(token)).resolves.toBe(false);
  await expect(actor.setStageLabel(token, "After logout")).resolves.toEqual({
    err: { notAuthenticated: null },
  });
});
