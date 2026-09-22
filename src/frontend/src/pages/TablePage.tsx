import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { TeamCrest } from "@/components/TeamCrest";
import { useLeagueTable } from "@/hooks/useTournament";
import { TABLE_COLUMNS, formatGoalDifference } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Full names for the abbreviated numeric columns, shown as a legend. */
const COLUMN_LEGEND = TABLE_COLUMNS.map((column) => ({
  short: column.short,
  label: column.label,
}));

export function TablePage() {
  const tableQuery = useLeagueTable();
  const rows = tableQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="League Stage"
        title="League Table"
        description="Ranked by points, then goal difference, then goals scored. The leader holds the acid-lime rail."
      />

      {tableQuery.isLoading ? (
        <LoadingState label="Loading league table" />
      ) : tableQuery.isError ? (
        <ErrorState
          message="We could not load the standings."
          onRetry={() => void tableQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No standings yet"
          description="The table fills in as soon as teams are registered and league results are entered."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              <table
                data-ocid="table.league_table"
                className="w-full min-w-[720px] border-collapse"
              >
                <caption className="sr-only">
                  League standings ranked by points, goal difference, and goals
                  scored. Columns: Played, Won, Drawn, Lost, Goals For, Goals
                  Against, Goal Difference, Points.
                </caption>
                <thead className="sticky top-0 z-10 bg-secondary">
                  <tr className="border-b border-border">
                    <th
                      scope="col"
                      className="px-3 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      #
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      Team
                    </th>
                    {TABLE_COLUMNS.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        title={column.label}
                        aria-label={column.label}
                        className="px-3 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                      >
                        {column.short}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const isLeader = index === 0;
                    return (
                      <tr
                        key={row.teamId.toString()}
                        data-ocid={`table.row.${index + 1}`}
                        className={cn(
                          "border-b border-border last:border-b-0 transition-smooth hover:bg-secondary/50",
                          index % 2 === 1 && "bg-secondary/25",
                        )}
                      >
                        <td className="relative px-3 py-3">
                          {isLeader ? (
                            <span
                              className="absolute inset-y-0 left-0 w-1 bg-primary"
                              aria-hidden="true"
                            />
                          ) : null}
                          <span
                            className={cn(
                              "font-mono text-sm font-bold tabular",
                              isLeader
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <TeamCrest
                              name={row.teamName}
                              shortCode={row.shortCode}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-display text-sm font-semibold text-foreground">
                                {row.teamName}
                              </p>
                              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                {row.shortCode}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td
                          title="Played"
                          className="px-3 py-3 text-right font-mono text-sm tabular text-foreground"
                        >
                          {row.played.toString()}
                        </td>
                        <td
                          title="Won"
                          className="px-3 py-3 text-right font-mono text-sm tabular text-foreground"
                        >
                          {row.won.toString()}
                        </td>
                        <td
                          title="Drawn"
                          className="px-3 py-3 text-right font-mono text-sm tabular text-foreground"
                        >
                          {row.drawn.toString()}
                        </td>
                        <td
                          title="Lost"
                          className="px-3 py-3 text-right font-mono text-sm tabular text-foreground"
                        >
                          {row.lost.toString()}
                        </td>
                        <td
                          title="Goals For"
                          className="px-3 py-3 text-right font-mono text-sm tabular text-foreground"
                        >
                          {row.goalsFor.toString()}
                        </td>
                        <td
                          title="Goals Against"
                          className="px-3 py-3 text-right font-mono text-sm tabular text-foreground"
                        >
                          {row.goalsAgainst.toString()}
                        </td>
                        <td
                          title="Goal Difference"
                          className={cn(
                            "px-3 py-3 text-right font-mono text-sm font-semibold tabular",
                            row.goalDifference > 0n
                              ? "text-primary"
                              : row.goalDifference < 0n
                                ? "text-destructive"
                                : "text-muted-foreground",
                          )}
                        >
                          {formatGoalDifference(row.goalDifference)}
                        </td>
                        <td
                          title="Points"
                          className="px-3 py-3 text-right font-mono text-base font-bold tabular text-foreground"
                        >
                          {row.points.toString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <dl
            data-ocid="table.legend"
            className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-border bg-card/60 px-4 py-3"
          >
            {COLUMN_LEGEND.map((entry) => (
              <div key={entry.short} className="flex items-baseline gap-2">
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {entry.short}
                </dt>
                <dd className="text-xs text-muted-foreground">{entry.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
