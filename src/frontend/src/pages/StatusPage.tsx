import type { MatchView } from "@/backend";
import { GoalLeaders } from "@/components/GoalLeaders";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { TeamCrest } from "@/components/TeamCrest";
import {
  useLeagueTable,
  useStatusMatches,
  useTournamentState,
} from "@/hooks/useTournament";
import { formatKickoff } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, Radio } from "lucide-react";

interface GroupProps {
  title: string;
  description: string;
  matches: MatchView[];
  icon: typeof Radio;
  accentClass: string;
  ocid: string;
}

function MatchGroup({
  title,
  description,
  matches,
  icon: Icon,
  accentClass,
  ocid,
}: GroupProps) {
  return (
    <section data-ocid={ocid} className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-md border ${accentClass}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-[0.12em] text-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="ml-auto font-mono text-sm font-semibold tabular text-muted-foreground">
          {matches.length}
        </span>
      </div>

      {matches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/60 px-4 py-6 text-center text-sm text-muted-foreground">
          No {title.toLowerCase()} matches.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-border bg-card">
          {matches.map((match) => (
            <li
              key={match.id.toString()}
              className="border-b border-border last:border-b-0"
            >
              <Link
                to="/match/$matchId"
                params={{ matchId: match.id.toString() }}
                data-ocid={`${ocid}.item`}
                className="flex items-center gap-3 px-4 py-3.5 transition-smooth hover:bg-secondary/60"
              >
                <TeamCrest
                  name={match.homeTeamName}
                  shortCode={match.homeTeamName}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {match.homeTeamName}
                  </p>
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {match.awayTeamName}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={match.status} />
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {formatKickoff(match.kickoff)}
                  </p>
                </div>
                <div className="w-14 shrink-0 text-right font-mono text-lg font-bold tabular text-foreground">
                  <p>{match.homeGoals?.toString() ?? "–"}</p>
                  <p>{match.awayGoals?.toString() ?? "–"}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StatusPage() {
  const stateQuery = useTournamentState();
  const statusQuery = useStatusMatches();
  const tableQuery = useLeagueTable();

  const data = statusQuery.data ?? { upcoming: [], live: [], completed: [] };
  const leagueRows = tableQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Match Status"
        title={stateQuery.data?.stageLabel ?? "Tournament status"}
        description="Every fixture grouped by its current state. Live matches update as the control room enters scores."
      />

      {statusQuery.isLoading ? (
        <LoadingState label="Loading match status" />
      ) : statusQuery.isError ? (
        <ErrorState
          message="We could not reach the tournament feed."
          onRetry={() => void statusQuery.refetch()}
        />
      ) : data.upcoming.length === 0 &&
        data.live.length === 0 &&
        data.completed.length === 0 ? (
        <EmptyState
          title="No matches on the board"
          description="Once the control room schedules fixtures they will appear here, grouped by state."
        />
      ) : (
        <div className="space-y-10">
          <MatchGroup
            ocid="status.live_section"
            title="Live"
            description="In play right now"
            matches={data.live}
            icon={Radio}
            accentClass="border-accent/50 bg-accent/15 text-accent"
          />
          <MatchGroup
            ocid="status.upcoming_section"
            title="Upcoming"
            description="Scheduled and waiting for kickoff"
            matches={data.upcoming}
            icon={CalendarClock}
            accentClass="border-border bg-secondary text-muted-foreground"
          />
          <MatchGroup
            ocid="status.completed_section"
            title="Completed"
            description="Full-time results"
            matches={data.completed}
            icon={CheckCircle2}
            accentClass="border-primary/40 bg-primary/10 text-primary"
          />
        </div>
      )}

      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {data.live.length} live · {data.upcoming.length} upcoming ·{" "}
        {data.completed.length} completed
      </p>

      <div className="space-y-10 border-t border-border pt-10">
        <div className="space-y-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Goal Leaders
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Attack &amp; Defence
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every team ranked across the league stage, counting completed
            fixtures only — the same results that build the league table.
          </p>
        </div>

        {tableQuery.isLoading ? (
          <LoadingState label="Loading goal leaders" />
        ) : tableQuery.isError ? (
          <ErrorState
            message="We could not load the goal leader lists."
            onRetry={() => void tableQuery.refetch()}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <GoalLeaders
              ocid="status.scoring_leaders"
              title="Best Scoring Teams"
              description="Most goals scored in completed league fixtures"
              metric="goalsFor"
              rows={leagueRows}
            />
            <GoalLeaders
              ocid="status.conceding_leaders"
              title="Best Conceding Teams"
              description="Most goals conceded in completed league fixtures"
              metric="goalsAgainst"
              rows={leagueRows}
            />
          </div>
        )}
      </div>
    </div>
  );
}
