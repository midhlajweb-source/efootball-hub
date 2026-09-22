import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  useFixtures,
  useKnockoutTies,
  useSetStageLabel,
  useTeams,
  useTournamentState,
} from "@/hooks/useTournament";
import { errorMessage } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { ListOrdered, Save, ShieldCheck, Swords, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STAGE_PRESETS = [
  "League Stage — Matchday 1",
  "League Stage — Matchday 2",
  "League Stage — Matchday 3",
  "Knockout — Round of 16",
  "Knockout — Quarter Finals",
  "Knockout — Semi Finals",
  "Knockout — Final",
  "Completed",
];

export function AdminOverviewPage() {
  const { token, logout } = useAdminSession();
  const stateQuery = useTournamentState();
  const teamsQuery = useTeams();
  const fixturesQuery = useFixtures();
  const tiesQuery = useKnockoutTies();
  const setStageLabel = useSetStageLabel();

  const [stageDraft, setStageDraft] = useState("");

  useEffect(() => {
    if (stateQuery.data) setStageDraft(stateQuery.data.stageLabel);
  }, [stateQuery.data]);

  const handleSaveStage = () => {
    if (!token) return;
    const value = stageDraft.trim();
    if (value === "") {
      toast.error("Stage label cannot be empty.");
      return;
    }
    setStageLabel.mutate(
      { token, stageLabel: value },
      {
        onSuccess: () => toast.success("Stage label updated."),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  const stats = [
    {
      label: "Teams",
      value: teamsQuery.data?.length ?? 0,
      to: "/admin/teams" as const,
    },
    {
      label: "Fixtures",
      value: fixturesQuery.data?.length ?? 0,
      to: "/admin/fixtures" as const,
    },
    {
      label: "Knockout ties",
      value: tiesQuery.data?.length ?? 0,
      to: "/admin/knockout" as const,
    },
  ];

  return (
    <AdminLayout username="Midhu" onLogout={() => void logout()}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Control Room"
          title="Tournament Overview"
          description="Set the current stage and jump into team, fixture, and knockout management."
        />

        <section className="grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              to={stat.to}
              data-ocid={`admin.stat.${stat.label.toLowerCase().replace(/\s+/g, "_")}`}
              className="rounded-lg border border-border bg-card p-5 transition-smooth hover:border-primary/50"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 font-display text-3xl font-bold tabular text-foreground">
                {stat.value}
              </p>
            </Link>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
              <Trophy className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold uppercase tracking-[0.12em] text-foreground">
                Current stage
              </h2>
              <p className="text-xs text-muted-foreground">
                Shown on the public hub and status page.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label
                htmlFor="stage-label"
                className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Stage label
              </label>
              <input
                id="stage-label"
                data-ocid="admin.stage_input"
                type="text"
                value={stageDraft}
                onChange={(event) => setStageDraft(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="e.g. League Stage — Matchday 3"
              />
            </div>
            <button
              type="button"
              data-ocid="admin.stage_save_button"
              onClick={handleSaveStage}
              disabled={setStageLabel.isPending || stageDraft.trim() === ""}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {setStageLabel.isPending ? "Saving…" : "Save stage"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {STAGE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                data-ocid="admin.stage_preset_button"
                onClick={() => setStageDraft(preset)}
                className="rounded-full border border-border bg-secondary px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-smooth hover:border-primary/50 hover:text-primary"
              >
                {preset}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            {
              to: "/admin/teams" as const,
              label: "Manage teams",
              description: "Create teams, set short codes, and upload crests.",
              icon: ShieldCheck,
            },
            {
              to: "/admin/fixtures" as const,
              label: "Manage fixtures",
              description: "Schedule league matches and enter results.",
              icon: ListOrdered,
            },
            {
              to: "/admin/knockout" as const,
              label: "Manage knockout",
              description: "Draw ties and record scores to advance winners.",
              icon: Swords,
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                data-ocid={`admin.action.${action.label.toLowerCase().replace(/\s+/g, "_")}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-smooth hover:border-primary/50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-display text-sm font-bold uppercase tracking-[0.1em] text-foreground">
                  {action.label}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {action.description}
                </span>
              </Link>
            );
          })}
        </section>
      </div>
    </AdminLayout>
  );
}
