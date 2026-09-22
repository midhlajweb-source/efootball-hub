import type { LeagueRow } from "@/backend";
import { TeamCrest } from "@/components/TeamCrest";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type LeaderMetric = "goalsFor" | "goalsAgainst";

interface GoalLeadersProps {
  title: string;
  description: string;
  metric: LeaderMetric;
  rows: LeagueRow[];
  ocid: string;
}

const METRIC_LABEL: Record<LeaderMetric, string> = {
  goalsFor: "Goals scored",
  goalsAgainst: "Goals conceded",
};

/**
 * Full ranking of every team by one goal metric, highest first. Ties break on
 * team name so the order stays stable between renders. Rows are display-only.
 */
export function GoalLeaders({
  title,
  description,
  metric,
  rows,
  ocid,
}: GoalLeadersProps) {
  const ranked = [...rows].sort((a, b) => {
    if (a[metric] !== b[metric]) return a[metric] > b[metric] ? -1 : 1;
    return a.teamName.localeCompare(b.teamName);
  });

  const isScoring = metric === "goalsFor";
  const MetricIcon = isScoring ? ArrowUpRight : ArrowDownRight;
  const accentClass = isScoring
    ? "border-primary/40 bg-primary/10 text-primary"
    : "border-accent/50 bg-accent/15 text-accent";

  return (
    <section data-ocid={ocid} className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md border",
            accentClass,
          )}
        >
          <MetricIcon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold uppercase tracking-[0.12em] text-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="ml-auto font-mono text-sm font-semibold tabular text-muted-foreground">
          {ranked.length}
        </span>
      </div>

      {ranked.length === 0 ? (
        <p
          data-ocid={`${ocid}.empty_state`}
          className="rounded-lg border border-dashed border-border bg-card/60 px-4 py-6 text-center text-sm text-muted-foreground"
        >
          No completed league fixtures yet — this leader list fills in once
          results are entered.
        </p>
      ) : (
        <ol className="overflow-hidden rounded-lg border border-border bg-card">
          {ranked.map((row, index) => {
            const isLeader = index === 0;
            return (
              <li
                key={row.teamId.toString()}
                data-ocid={`${ocid}.item.${index + 1}`}
                className={cn(
                  "relative flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
                  index % 2 === 1 && "bg-secondary/25",
                )}
              >
                {isLeader ? (
                  <span
                    className="absolute inset-y-0 left-0 w-1 bg-primary"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={cn(
                    "w-6 shrink-0 text-center font-mono text-sm font-bold tabular",
                    isLeader ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <TeamCrest
                  name={row.teamName}
                  shortCode={row.shortCode}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {row.teamName}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {row.shortCode}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "font-mono text-lg font-bold tabular",
                      isLeader ? "text-primary" : "text-foreground",
                    )}
                  >
                    {row[metric].toString()}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {METRIC_LABEL[metric]}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
