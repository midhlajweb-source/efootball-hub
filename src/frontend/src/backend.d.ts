import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type AdminError = {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notAuthenticated";
    notAuthenticated: null;
} | {
    __kind__: "notFound";
    notFound: null;
} | {
    __kind__: "invalidCredentials";
    invalidCredentials: null;
};
export interface AdminSession {
    token: string;
    username: string;
}
export interface BracketRoundView {
    ties: Array<TieView>;
    round: KnockoutRound;
}
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Fixture {
    id: FixtureId;
    status: MatchStatus;
    awayTeamId: TeamId;
    homeTeamId: TeamId;
    kickoff: Timestamp;
    homeGoals?: bigint;
    matchday: bigint;
    awayGoals?: bigint;
}
export type FixtureId = bigint;
export interface KnockoutTie {
    id: TieId;
    homePenalties?: bigint;
    awayTeamId?: TeamId;
    slot: bigint;
    awayPenalties?: bigint;
    homeTeamId?: TeamId;
    homeGoals?: bigint;
    winnerTeamId?: TeamId;
    awayGoals?: bigint;
    round: KnockoutRound;
}
export interface LeagueRow {
    won: bigint;
    teamName: string;
    goalDifference: bigint;
    played: bigint;
    lost: bigint;
    goalsFor: bigint;
    shortCode: string;
    goalsAgainst: bigint;
    teamId: TeamId;
    drawn: bigint;
    points: bigint;
}
export interface MatchView {
    id: FixtureId;
    status: MatchStatus;
    awayTeamName: string;
    homeTeamName: string;
    kickoff: Timestamp;
    homeGoals?: bigint;
    matchday: bigint;
    awayGoals?: bigint;
}
export type Result = {
    __kind__: "ok";
    ok: Team;
} | {
    __kind__: "err";
    err: AdminError;
};
export type Result_1 = {
    __kind__: "ok";
    ok: Fixture;
} | {
    __kind__: "err";
    err: AdminError;
};
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: AdminError;
};
export type Result_3 = {
    __kind__: "ok";
    ok: KnockoutTie;
} | {
    __kind__: "err";
    err: AdminError;
};
export type Result_4 = {
    __kind__: "ok";
    ok: Array<Fixture>;
} | {
    __kind__: "err";
    err: AdminError;
};
export type Result_5 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface Team {
    id: TeamId;
    name: string;
    crestUrl?: string;
    shortCode: string;
}
export type TeamId = bigint;
export type TieId = bigint;
export interface TieView {
    id: TieId;
    homePenalties?: bigint;
    slot: bigint;
    awayTeamName?: string;
    awayPenalties?: bigint;
    winnerTeamName?: string;
    homeTeamName?: string;
    homeGoals?: bigint;
    awayGoals?: bigint;
    round: KnockoutRound;
}
export type Timestamp = bigint;
export interface TournamentState {
    tournamentName: string;
    stageLabel: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum KnockoutRound {
    final = "final",
    quarterFinal = "quarterFinal",
    roundOf16 = "roundOf16",
    semiFinal = "semiFinal"
}
export enum MatchStatus {
    upcoming = "upcoming",
    live = "live",
    completed = "completed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminLogin(username: string, password: string): Promise<AdminSession | null>;
    adminLogout(token: string): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFixture(token: string, homeTeamId: TeamId, awayTeamId: TeamId, matchday: bigint, kickoff: Timestamp): Promise<Result_1>;
    createKnockoutTie(token: string, round: KnockoutRound, slot: bigint, homeTeamId: TeamId | null, awayTeamId: TeamId | null): Promise<Result_3>;
    createTeam(token: string, name: string, shortCode: string, crestUrl: string | null): Promise<Result>;
    deleteFixture(token: string, id: FixtureId): Promise<Result_2>;
    deleteKnockoutTie(token: string, id: TieId): Promise<Result_2>;
    deleteTeam(token: string, id: TeamId): Promise<Result_2>;
    execute(qJson: string): Promise<Result__1>;
    generateRoundRobinFixtures(token: string): Promise<Result_4>;
    getApiDoc(): Promise<string>;
    getBracket(): Promise<Array<BracketRoundView>>;
    getCallerUserRole(): Promise<UserRole>;
    getLeagueTable(): Promise<Array<LeagueRow>>;
    getMatch(id: FixtureId): Promise<MatchView | null>;
    getStatusMatches(): Promise<{
        upcoming: Array<MatchView>;
        live: Array<MatchView>;
        completed: Array<MatchView>;
    }>;
    getTournamentState(): Promise<TournamentState>;
    isAdminSession(token: string): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    listFixtures(): Promise<Array<Fixture>>;
    listKnockoutTies(): Promise<Array<KnockoutTie>>;
    listTeams(): Promise<Array<Team>>;
    schema(): Promise<string>;
    setFixtureResult(token: string, id: FixtureId, homeGoals: bigint | null, awayGoals: bigint | null, status: MatchStatus): Promise<Result_1>;
    setKnockoutResult(token: string, id: TieId, homeGoals: bigint | null, awayGoals: bigint | null, homePenalties: bigint | null, awayPenalties: bigint | null): Promise<Result_3>;
    setStageLabel(token: string, stageLabel: string): Promise<Result_2>;
    updateFixture(token: string, id: FixtureId, homeTeamId: TeamId, awayTeamId: TeamId, matchday: bigint, kickoff: Timestamp): Promise<Result_1>;
    updateTeam(token: string, id: TeamId, name: string, shortCode: string, crestUrl: string | null): Promise<Result>;
}
