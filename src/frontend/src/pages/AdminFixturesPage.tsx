import { type Fixture, MatchStatus } from "@/backend";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, LoadingState } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  useCreateFixture,
  useDeleteFixture,
  useFixtures,
  useGenerateRoundRobinFixtures,
  useSetFixtureResult,
  useTeams,
  useUpdateFixture,
} from "@/hooks/useTournament";
import { errorMessage, parseCount, parseOptionalCount } from "@/lib/api";
import {
  formatKickoff,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/lib/format";
import { CalendarRange, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FixtureDraft {
  homeTeamId: string;
  awayTeamId: string;
  matchday: string;
  kickoff: string;
}

const EMPTY_DRAFT: FixtureDraft = {
  homeTeamId: "",
  awayTeamId: "",
  matchday: "1",
  kickoff: "",
};

export function AdminFixturesPage() {
  const { token, logout } = useAdminSession();
  const teamsQuery = useTeams();
  const fixturesQuery = useFixtures();
  const createFixture = useCreateFixture();
  const updateFixture = useUpdateFixture();
  const deleteFixture = useDeleteFixture();
  const setFixtureResult = useSetFixtureResult();
  const generateFixtures = useGenerateRoundRobinFixtures();

  const [draft, setDraft] = useState<FixtureDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [confirmingGenerate, setConfirmingGenerate] = useState(false);
  const [resultDrafts, setResultDrafts] = useState<
    Record<string, { home: string; away: string; status: MatchStatus }>
  >({});

  const teams = teamsQuery.data ?? [];
  const fixtures = fixturesQuery.data ?? [];
  const teamName = (id: bigint) =>
    teams.find((team) => team.id === id)?.name ?? `Team ${id}`;
  const isSaving = createFixture.isPending || updateFixture.isPending;

  const resetForm = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    const homeTeamId = parseCount(draft.homeTeamId);
    const awayTeamId = parseCount(draft.awayTeamId);
    const matchday = parseCount(draft.matchday);
    const kickoff = fromDateTimeLocalValue(draft.kickoff);

    if (homeTeamId === null || awayTeamId === null) {
      toast.error("Select both a home and an away team.");
      return;
    }
    if (homeTeamId === awayTeamId) {
      toast.error("A team cannot play itself.");
      return;
    }
    if (matchday === null || matchday < 1n) {
      toast.error("Matchday must be a positive whole number.");
      return;
    }
    if (kickoff === null) {
      toast.error("Choose a kickoff date and time.");
      return;
    }

    if (editingId !== null) {
      updateFixture.mutate(
        { token, id: editingId, homeTeamId, awayTeamId, matchday, kickoff },
        {
          onSuccess: () => {
            toast.success("Fixture updated.");
            resetForm();
          },
          onError: (error) => toast.error(errorMessage(error)),
        },
      );
      return;
    }

    createFixture.mutate(
      { token, homeTeamId, awayTeamId, matchday, kickoff },
      {
        onSuccess: () => {
          toast.success("Fixture scheduled.");
          resetForm();
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  const startEdit = (fixture: Fixture) => {
    setEditingId(fixture.id);
    setDraft({
      homeTeamId: fixture.homeTeamId.toString(),
      awayTeamId: fixture.awayTeamId.toString(),
      matchday: fixture.matchday.toString(),
      kickoff: toDateTimeLocalValue(fixture.kickoff),
    });
  };

  const handleDelete = (fixture: Fixture) => {
    if (!token) return;
    deleteFixture.mutate(
      { token, id: fixture.id },
      {
        onSuccess: () => {
          toast.success("Fixture removed.");
          if (editingId === fixture.id) resetForm();
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  const resultDraftFor = (fixture: Fixture) =>
    resultDrafts[fixture.id.toString()] ?? {
      home: fixture.homeGoals?.toString() ?? "",
      away: fixture.awayGoals?.toString() ?? "",
      status: fixture.status,
    };

  const updateResultDraft = (
    fixture: Fixture,
    patch: Partial<{ home: string; away: string; status: MatchStatus }>,
  ) => {
    setResultDrafts((current) => ({
      ...current,
      [fixture.id.toString()]: { ...resultDraftFor(fixture), ...patch },
    }));
  };

  const handleSaveResult = (fixture: Fixture) => {
    if (!token) return;
    const result = resultDraftFor(fixture);
    const homeGoals = parseOptionalCount(result.home);
    const awayGoals = parseOptionalCount(result.away);
    if (
      result.status === MatchStatus.completed &&
      (homeGoals === null || awayGoals === null)
    ) {
      toast.error("Enter both scores before marking the match completed.");
      return;
    }
    setFixtureResult.mutate(
      { token, id: fixture.id, homeGoals, awayGoals, status: result.status },
      {
        onSuccess: () => toast.success("Result saved."),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  const handleGenerate = () => {
    if (!token) return;
    generateFixtures.mutate(
      { token },
      {
        onSuccess: (generated) => {
          setConfirmingGenerate(false);
          resetForm();
          setResultDrafts({});
          toast.success(
            `Generated ${generated.length} ${
              generated.length === 1 ? "fixture" : "fixtures"
            } across the round-robin schedule.`,
          );
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  return (
    <AdminLayout username="Midhu" onLogout={() => void logout()}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="League Stage"
          title="Fixtures"
          description="Schedule league matches, then enter scores and set each match state."
        />

        <section
          data-ocid="admin.generate_panel"
          className="rounded-lg border border-primary/30 bg-gradient-subtle p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h2 className="font-display text-base font-bold uppercase tracking-[0.12em] text-foreground">
                Round-robin generator
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Build a complete single round-robin schedule for every
                registered team. Home and away sides alternate and matches are
                spread across matchdays. All generated fixtures start as
                upcoming with no scores.
              </p>
            </div>
            <button
              type="button"
              data-ocid="admin.generate_fixtures_button"
              onClick={() => {
                if (fixtures.length > 0) {
                  setConfirmingGenerate(true);
                  return;
                }
                handleGenerate();
              }}
              disabled={teams.length < 2 || generateFixtures.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CalendarRange className="h-4 w-4" aria-hidden="true" />
              {generateFixtures.isPending ? "Generating…" : "Generate fixtures"}
            </button>
          </div>

          {teams.length < 2 ? (
            <p
              data-ocid="admin.generate_hint"
              className="mt-4 rounded-md border border-dashed border-border bg-card/60 px-3 py-2 text-sm text-muted-foreground"
            >
              Add at least two teams before generating a schedule.
            </p>
          ) : null}

          {confirmingGenerate ? (
            <div
              data-ocid="admin.generate_confirm"
              className="mt-4 rounded-md border border-accent/50 bg-accent/10 p-4"
            >
              <p className="text-sm text-foreground">
                This will replace{" "}
                <span className="font-mono font-semibold tabular">
                  {fixtures.length}
                </span>{" "}
                existing {fixtures.length === 1 ? "fixture" : "fixtures"},
                including any results already entered. Continue?
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-ocid="admin.generate_confirm_button"
                  onClick={handleGenerate}
                  disabled={generateFixtures.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
                  {generateFixtures.isPending
                    ? "Generating…"
                    : "Replace fixtures"}
                </button>
                <button
                  type="button"
                  data-ocid="admin.generate_cancel_button"
                  onClick={() => setConfirmingGenerate(false)}
                  disabled={generateFixtures.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-smooth hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {teams.length < 2 ? (
          <p className="rounded-lg border border-dashed border-border bg-card/60 px-4 py-6 text-sm text-muted-foreground">
            Add at least two teams before scheduling fixtures.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            data-ocid="admin.fixture_form"
            className="space-y-4 rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold uppercase tracking-[0.12em] text-foreground">
                {editingId !== null ? "Edit fixture" : "Schedule fixture"}
              </h2>
              {editingId !== null ? (
                <button
                  type="button"
                  data-ocid="admin.fixture_cancel_button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-smooth hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Cancel edit
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="fixture-home"
                  className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Home team
                </label>
                <select
                  id="fixture-home"
                  data-ocid="admin.fixture_home_select"
                  value={draft.homeTeamId}
                  onChange={(event) =>
                    setDraft((c) => ({ ...c, homeTeamId: event.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <option value="">Select home team</option>
                  {teams.map((team) => (
                    <option key={team.id.toString()} value={team.id.toString()}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="fixture-away"
                  className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Away team
                </label>
                <select
                  id="fixture-away"
                  data-ocid="admin.fixture_away_select"
                  value={draft.awayTeamId}
                  onChange={(event) =>
                    setDraft((c) => ({ ...c, awayTeamId: event.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <option value="">Select away team</option>
                  {teams.map((team) => (
                    <option key={team.id.toString()} value={team.id.toString()}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="fixture-matchday"
                  className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Matchday
                </label>
                <input
                  id="fixture-matchday"
                  data-ocid="admin.fixture_matchday_input"
                  type="number"
                  min={1}
                  value={draft.matchday}
                  onChange={(event) =>
                    setDraft((c) => ({ ...c, matchday: event.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 font-mono text-sm tabular text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="fixture-kickoff"
                  className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Kickoff
                </label>
                <input
                  id="fixture-kickoff"
                  data-ocid="admin.fixture_kickoff_input"
                  type="datetime-local"
                  value={draft.kickoff}
                  onChange={(event) =>
                    setDraft((c) => ({ ...c, kickoff: event.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>
            </div>

            <button
              type="submit"
              data-ocid="admin.fixture_submit_button"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {isSaving
                ? "Saving…"
                : editingId !== null
                  ? "Save fixture"
                  : "Schedule fixture"}
            </button>
          </form>
        )}

        {fixturesQuery.isLoading ? (
          <LoadingState label="Loading fixtures" />
        ) : fixtures.length === 0 ? (
          <EmptyState
            title="No fixtures scheduled"
            description="Schedule the first league match above and it will appear on the public status page."
          />
        ) : (
          <ul className="space-y-3">
            {fixtures.map((fixture, index) => {
              const result = resultDraftFor(fixture);
              return (
                <li
                  key={fixture.id.toString()}
                  data-ocid={`admin.fixture_item.${index + 1}`}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-foreground">
                        {teamName(fixture.homeTeamId)}{" "}
                        <span className="text-muted-foreground">vs</span>{" "}
                        {teamName(fixture.awayTeamId)}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Matchday {fixture.matchday.toString()} ·{" "}
                        {formatKickoff(fixture.kickoff)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={fixture.status} />
                      <button
                        type="button"
                        data-ocid={`admin.fixture_edit_button.${index + 1}`}
                        onClick={() => startEdit(fixture)}
                        aria-label="Edit fixture"
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-smooth hover:border-primary/50 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        data-ocid={`admin.fixture_delete_button.${index + 1}`}
                        onClick={() => handleDelete(fixture)}
                        disabled={deleteFixture.isPending}
                        aria-label="Delete fixture"
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-smooth hover:border-destructive/60 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`fixture-home-goals-${index}`}
                        className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        Home goals
                      </label>
                      <input
                        id={`fixture-home-goals-${index}`}
                        data-ocid={`admin.fixture_home_goals_input.${index + 1}`}
                        type="number"
                        min={0}
                        value={result.home}
                        onChange={(event) =>
                          updateResultDraft(fixture, {
                            home: event.target.value,
                          })
                        }
                        className="w-24 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm tabular text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`fixture-away-goals-${index}`}
                        className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        Away goals
                      </label>
                      <input
                        id={`fixture-away-goals-${index}`}
                        data-ocid={`admin.fixture_away_goals_input.${index + 1}`}
                        type="number"
                        min={0}
                        value={result.away}
                        onChange={(event) =>
                          updateResultDraft(fixture, {
                            away: event.target.value,
                          })
                        }
                        className="w-24 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm tabular text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`fixture-status-${index}`}
                        className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        State
                      </label>
                      <select
                        id={`fixture-status-${index}`}
                        data-ocid={`admin.fixture_status_select.${index + 1}`}
                        value={result.status}
                        onChange={(event) =>
                          updateResultDraft(fixture, {
                            status: event.target.value as MatchStatus,
                          })
                        }
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        <option value={MatchStatus.upcoming}>Upcoming</option>
                        <option value={MatchStatus.live}>Live</option>
                        <option value={MatchStatus.completed}>Completed</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      data-ocid={`admin.fixture_save_result_button.${index + 1}`}
                      onClick={() => handleSaveResult(fixture)}
                      disabled={setFixtureResult.isPending}
                      className="inline-flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 font-display text-xs font-bold uppercase tracking-[0.12em] text-primary transition-smooth hover:bg-primary/20 disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      Save result
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
