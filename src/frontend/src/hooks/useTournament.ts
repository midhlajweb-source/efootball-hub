import {
  type Fixture,
  type FixtureId,
  type KnockoutRound,
  type KnockoutTie,
  type MatchStatus,
  type Team,
  type TeamId,
  type TieId,
  createActor,
} from "@/backend";
import { unwrapResult } from "@/lib/api";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PUBLIC_KEYS = [
  ["tournamentState"],
  ["teams"],
  ["fixtures"],
  ["knockoutTies"],
  ["leagueTable"],
  ["bracket"],
  ["statusMatches"],
] as const;

function useInvalidateTournament() {
  const queryClient = useQueryClient();
  return () => {
    for (const queryKey of PUBLIC_KEYS) {
      void queryClient.invalidateQueries({ queryKey });
    }
  };
}

/* ---------------------------------- reads --------------------------------- */

export function useTournamentState() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["tournamentState"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTournamentState();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTeams() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["teams"],
    queryFn: async (): Promise<Team[]> => {
      if (!actor) return [];
      return actor.listTeams();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFixtures() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["fixtures"],
    queryFn: async (): Promise<Fixture[]> => {
      if (!actor) return [];
      return actor.listFixtures();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useKnockoutTies() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["knockoutTies"],
    queryFn: async (): Promise<KnockoutTie[]> => {
      if (!actor) return [];
      return actor.listKnockoutTies();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLeagueTable() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["leagueTable"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeagueTable();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBracket() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["bracket"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBracket();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStatusMatches() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["statusMatches"],
    queryFn: async () => {
      if (!actor) return { upcoming: [], live: [], completed: [] };
      return actor.getStatusMatches();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMatch(id: FixtureId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["match", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getMatch(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/* --------------------------------- writes --------------------------------- */

export function useSetStageLabel() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: { token: string; stageLabel: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(
        await actor.setStageLabel(input.token, input.stageLabel),
      );
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useCreateTeam() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: {
      token: string;
      name: string;
      shortCode: string;
      crestUrl: string | null;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(
        await actor.createTeam(
          input.token,
          input.name,
          input.shortCode,
          input.crestUrl,
        ),
      );
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateTeam() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: {
      token: string;
      id: TeamId;
      name: string;
      shortCode: string;
      crestUrl: string | null;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(
        await actor.updateTeam(
          input.token,
          input.id,
          input.name,
          input.shortCode,
          input.crestUrl,
        ),
      );
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeleteTeam() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: { token: string; id: TeamId }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(await actor.deleteTeam(input.token, input.id));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useCreateFixture() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: {
      token: string;
      homeTeamId: TeamId;
      awayTeamId: TeamId;
      matchday: bigint;
      kickoff: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(
        await actor.createFixture(
          input.token,
          input.homeTeamId,
          input.awayTeamId,
          input.matchday,
          input.kickoff,
        ),
      );
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateFixture() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: {
      token: string;
      id: FixtureId;
      homeTeamId: TeamId;
      awayTeamId: TeamId;
      matchday: bigint;
      kickoff: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(
        await actor.updateFixture(
          input.token,
          input.id,
          input.homeTeamId,
          input.awayTeamId,
          input.matchday,
          input.kickoff,
        ),
      );
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeleteFixture() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: { token: string; id: FixtureId }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(await actor.deleteFixture(input.token, input.id));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useGenerateRoundRobinFixtures() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: { token: string }): Promise<Fixture[]> => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(await actor.generateRoundRobinFixtures(input.token));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useSetFixtureResult() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: {
      token: string;
      id: FixtureId;
      homeGoals: bigint | null;
      awayGoals: bigint | null;
      status: MatchStatus;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(
        await actor.setFixtureResult(
          input.token,
          input.id,
          input.homeGoals,
          input.awayGoals,
          input.status,
        ),
      );
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useCreateKnockoutTie() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: {
      token: string;
      round: KnockoutRound;
      slot: bigint;
      homeTeamId: TeamId | null;
      awayTeamId: TeamId | null;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(
        await actor.createKnockoutTie(
          input.token,
          input.round,
          input.slot,
          input.homeTeamId,
          input.awayTeamId,
        ),
      );
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useSetKnockoutResult() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: {
      token: string;
      id: TieId;
      homeGoals: bigint | null;
      awayGoals: bigint | null;
      homePenalties?: bigint | null;
      awayPenalties?: bigint | null;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(
        await actor.setKnockoutResult(
          input.token,
          input.id,
          input.homeGoals,
          input.awayGoals,
          input.homePenalties ?? null,
          input.awayPenalties ?? null,
        ),
      );
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeleteKnockoutTie() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: async (input: { token: string; id: TieId }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrapResult(await actor.deleteKnockoutTie(input.token, input.id));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}
