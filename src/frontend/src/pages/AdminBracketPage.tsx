import { KnockoutRound, type KnockoutTie } from "@/backend";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, LoadingState } from "@/components/States";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  useCreateKnockoutTie,
  useDeleteKnockoutTie,
  useKnockoutTies,
  useSetKnockoutResult,
  useTeams,
} from "@/hooks/useTournament";
import { errorMessage, parseCount, parseOptionalCount } from "@/lib/api";
import {
  KNOCKOUT_ROUND_LABEL,
  KNOCKOUT_ROUND_ORDER,
  isLevelAfterNormalTime,
} from "@/lib/format";
import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TieDraft {
  round: KnockoutRound;
  slot: string;
  homeTeamId: string;
  awayTeamId: string;
}

interface ResultDraft {
  home: string;
  away: string;
  homePens: string;
  awayPens: string;
  showPens: boolean;
}

const EMPTY_DRAFT: TieDraft = {
  round: KnockoutRound.roundOf16,
  slot: "1",
  homeTeamId: "",
  awayTeamId: "",
};

export function AdminBracketPage() {
  const { token, logout } = useAdminSession();
  const teamsQuery = useTeams();
  const tiesQuery = useKnockoutTies();
  const createTie = useCreateKnockoutTie();
  const setResult = useSetKnockoutResult();
  const deleteTie = useDeleteKnockoutTie();

  const [draft, setDraft] = useState<TieDraft>(EMPTY_DRAFT);
  const [resultDrafts, setResultDrafts] = useState<Record<string, ResultDraft>>(
    {},
  );

  const teams = teamsQuery.data ?? [];
  const ties = tiesQuery.data ?? [];
  const teamName = (id: bigint | undefined) =>
    id === undefined
      ? "To be decided"
      : (teams.find((team) => team.id === id)?.name ?? `Team ${id}`);

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    const slot = parseCount(draft.slot);
    if (slot === null || slot < 1n) {
      toast.error("Slot must be a positive whole number.");
      return;
    }
    const homeTeamId =
      draft.homeTeamId === "" ? null : parseCount(draft.homeTeamId);
    const awayTeamId =
      draft.awayTeamId === "" ? null : parseCount(draft.awayTeamId);
    if (homeTeamId !== null && homeTeamId === awayTeamId) {
      toast.error("A team cannot occupy both sides of a tie.");
      return;
    }
    createTie.mutate(
      { token, round: draft.round, slot, homeTeamId, awayTeamId },
      {
        onSuccess: () => {
          toast.success("Knockout tie created.");
          setDraft((current) => ({ ...current, slot: (slot + 1n).toString() }));
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  const resultDraftFor = (tie: KnockoutTie): ResultDraft =>
    resultDrafts[tie.id.toString()] ?? {
      home: tie.homeGoals?.toString() ?? "",
      away: tie.awayGoals?.toString() ?? "",
      homePens: tie.homePenalties?.toString() ?? "",
      awayPens: tie.awayPenalties?.toString() ?? "",
      showPens:
        tie.homePenalties !== undefined || tie.awayPenalties !== undefined,
    };

  const updateResultDraft = (tie: KnockoutTie, patch: Partial<ResultDraft>) => {
    setResultDrafts((current) => ({
      ...current,
      [tie.id.toString()]: { ...resultDraftFor(tie), ...patch },
    }));
  };

  const handleSaveResult = (tie: KnockoutTie) => {
    if (!token) return;
    const result = resultDraftFor(tie);
    const homeGoals = parseOptionalCount(result.home);
    const awayGoals = parseOptionalCount(result.away);
    if (homeGoals === null || awayGoals === null) {
      toast.error("Enter both scores to record the tie result.");
      return;
    }

    const level = isLevelAfterNormalTime(homeGoals, awayGoals);
    const pensRequested = level || result.showPens;
    let homePenalties: bigint | null = null;
    let awayPenalties: bigint | null = null;

    if (pensRequested) {
      homePenalties = parseOptionalCount(result.homePens);
      awayPenalties = parseOptionalCount(result.awayPens);
      if (homePenalties === null || awayPenalties === null) {
        toast.error(
          "Enter both penalty shootout scores, or clear them to save without a shootout.",
        );
        return;
      }
      if (homePenalties === awayPenalties) {
        toast.error("A penalty shootout cannot end level.");
        return;
      }
    }

    setResult.mutate(
      {
        token,
        id: tie.id,
        homeGoals,
        awayGoals,
        homePenalties,
        awayPenalties,
      },
      {
        onSuccess: () =>
          toast.success(
            level
              ? "Tie result saved. The penalty winner advances automatically."
              : "Tie result saved. The winner advances automatically.",
          ),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  const handleDelete = (tie: KnockoutTie) => {
    if (!token) return;
    deleteTie.mutate(
      { token, id: tie.id },
      {
        onSuccess: () => toast.success("Knockout tie removed."),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  return (
    <AdminLayout username="Midhu" onLogout={() => void logout()}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Knockout Stage"
          title="Knockout Ties"
          description="Draw each round, then record scores. The winner advances to the next round automatically."
        />

        <form
          onSubmit={handleCreate}
          data-ocid="admin.tie_form"
          className="space-y-4 rounded-lg border border-border bg-card p-5"
        >
          <h2 className="font-display text-base font-bold uppercase tracking-[0.12em] text-foreground">
            Draw a tie
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="tie-round"
                className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Round
              </label>
              <select
                id="tie-round"
                data-ocid="admin.tie_round_select"
                value={draft.round}
                onChange={(event) =>
                  setDraft((c) => ({
                    ...c,
                    round: event.target.value as KnockoutRound,
                  }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {KNOCKOUT_ROUND_ORDER.map((round) => (
                  <option key={round} value={round}>
                    {KNOCKOUT_ROUND_LABEL[round]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="tie-slot"
                className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Slot
              </label>
              <input
                id="tie-slot"
                data-ocid="admin.tie_slot_input"
                type="number"
                min={1}
                value={draft.slot}
                onChange={(event) =>
                  setDraft((c) => ({ ...c, slot: event.target.value }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 font-mono text-sm tabular text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="tie-home"
                className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Home team
              </label>
              <select
                id="tie-home"
                data-ocid="admin.tie_home_select"
                value={draft.homeTeamId}
                onChange={(event) =>
                  setDraft((c) => ({ ...c, homeTeamId: event.target.value }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <option value="">To be decided</option>
                {teams.map((team) => (
                  <option key={team.id.toString()} value={team.id.toString()}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="tie-away"
                className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Away team
              </label>
              <select
                id="tie-away"
                data-ocid="admin.tie_away_select"
                value={draft.awayTeamId}
                onChange={(event) =>
                  setDraft((c) => ({ ...c, awayTeamId: event.target.value }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <option value="">To be decided</option>
                {teams.map((team) => (
                  <option key={team.id.toString()} value={team.id.toString()}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            data-ocid="admin.tie_submit_button"
            disabled={createTie.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {createTie.isPending ? "Creating…" : "Create tie"}
          </button>
        </form>

        {tiesQuery.isLoading ? (
          <LoadingState label="Loading knockout ties" />
        ) : ties.length === 0 ? (
          <EmptyState
            title="No knockout ties drawn"
            description="Create the first tie above once the league stage concludes."
          />
        ) : (
          <div className="space-y-8">
            {KNOCKOUT_ROUND_ORDER.map((round) => {
              const roundTies = ties.filter((tie) => tie.round === round);
              if (roundTies.length === 0) return null;
              return (
                <section key={round} className="space-y-3">
                  <h3 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-primary">
                    {KNOCKOUT_ROUND_LABEL[round]}
                  </h3>
                  <ul className="space-y-3">
                    {roundTies.map((tie, index) => {
                      const result = resultDraftFor(tie);
                      const levelAfterNormalTime = isLevelAfterNormalTime(
                        parseOptionalCount(result.home),
                        parseOptionalCount(result.away),
                      );
                      const showPenalties =
                        levelAfterNormalTime || result.showPens;
                      return (
                        <li
                          key={tie.id.toString()}
                          data-ocid={`admin.tie_item.${index + 1}`}
                          className="rounded-lg border border-border bg-card p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-display text-sm font-semibold text-foreground">
                                {teamName(tie.homeTeamId)}{" "}
                                <span className="text-muted-foreground">
                                  vs
                                </span>{" "}
                                {teamName(tie.awayTeamId)}
                              </p>
                              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                Slot {tie.slot.toString()}
                                {tie.winnerTeamId !== undefined
                                  ? ` · ${teamName(tie.winnerTeamId)} advanced`
                                  : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              data-ocid={`admin.tie_delete_button.${index + 1}`}
                              onClick={() => handleDelete(tie)}
                              disabled={deleteTie.isPending}
                              aria-label="Delete knockout tie"
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-smooth hover:border-destructive/60 hover:text-destructive disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>

                          <div className="mt-4 space-y-3 border-t border-border pt-4">
                            <div className="flex flex-wrap items-end gap-3">
                              <div className="space-y-1.5">
                                <label
                                  htmlFor={`tie-home-goals-${index}`}
                                  className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                                >
                                  Home goals
                                </label>
                                <input
                                  id={`tie-home-goals-${index}`}
                                  data-ocid={`admin.tie_home_goals_input.${index + 1}`}
                                  type="number"
                                  min={0}
                                  value={result.home}
                                  onChange={(event) =>
                                    updateResultDraft(tie, {
                                      home: event.target.value,
                                    })
                                  }
                                  className="w-24 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm tabular text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label
                                  htmlFor={`tie-away-goals-${index}`}
                                  className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                                >
                                  Away goals
                                </label>
                                <input
                                  id={`tie-away-goals-${index}`}
                                  data-ocid={`admin.tie_away_goals_input.${index + 1}`}
                                  type="number"
                                  min={0}
                                  value={result.away}
                                  onChange={(event) =>
                                    updateResultDraft(tie, {
                                      away: event.target.value,
                                    })
                                  }
                                  className="w-24 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm tabular text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                                />
                              </div>
                              <button
                                type="button"
                                data-ocid={`admin.tie_save_result_button.${index + 1}`}
                                onClick={() => handleSaveResult(tie)}
                                disabled={setResult.isPending}
                                className="inline-flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] text-primary transition-smooth hover:bg-primary/20 disabled:opacity-50"
                              >
                                <Save
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                Save result
                              </button>
                            </div>

                            {levelAfterNormalTime ? (
                              <p
                                data-ocid={`admin.tie_level_notice.${index + 1}`}
                                className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent"
                              >
                                Level after normal time — enter the penalty
                                shootout score to decide who advances.
                              </p>
                            ) : null}

                            {showPenalties ? (
                              <div className="flex flex-wrap items-end gap-3 rounded-md border border-dashed border-border bg-secondary/40 p-3">
                                <div className="space-y-1.5">
                                  <label
                                    htmlFor={`tie-home-pens-${index}`}
                                    className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                                  >
                                    Home pens
                                  </label>
                                  <input
                                    id={`tie-home-pens-${index}`}
                                    data-ocid={`admin.tie_home_penalties_input.${index + 1}`}
                                    type="number"
                                    min={0}
                                    value={result.homePens}
                                    onChange={(event) =>
                                      updateResultDraft(tie, {
                                        homePens: event.target.value,
                                      })
                                    }
                                    className="w-24 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm tabular text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label
                                    htmlFor={`tie-away-pens-${index}`}
                                    className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                                  >
                                    Away pens
                                  </label>
                                  <input
                                    id={`tie-away-pens-${index}`}
                                    data-ocid={`admin.tie_away_penalties_input.${index + 1}`}
                                    type="number"
                                    min={0}
                                    value={result.awayPens}
                                    onChange={(event) =>
                                      updateResultDraft(tie, {
                                        awayPens: event.target.value,
                                      })
                                    }
                                    className="w-24 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm tabular text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                                  />
                                </div>
                                <p className="pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                                  Penalty shootout
                                </p>
                              </div>
                            ) : (
                              <button
                                type="button"
                                data-ocid={`admin.tie_toggle_penalties_button.${index + 1}`}
                                onClick={() =>
                                  updateResultDraft(tie, { showPens: true })
                                }
                                className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 transition-smooth hover:text-primary hover:underline"
                              >
                                Add penalty shootout score
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
