import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { TeamCrest } from "@/components/TeamCrest";
import { useBracket, useMatch } from "@/hooks/useTournament";
import { formatKickoff, formatPenalties } from "@/lib/format";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, Hash } from "lucide-react";

export function MatchDetailPage() {
  const { matchId } = useParams({ from: "/public/match/$matchId" });
  const id = /^\d+$/.test(matchId) ? BigInt(matchId) : null;
  const matchQuery = useMatch(id);
  const bracketQuery = useBracket();
  const match = matchQuery.data;

  // Knockout ties are stored separately from league fixtures, so a fixture that
  // mirrors a tie is matched on its two team names and normal-time score to
  // surface the shootout score alongside it.
  const tie = match
    ? (bracketQuery.data ?? [])
        .flatMap((round) => round.ties)
        .find(
          (candidate) =>
            candidate.homeTeamName === match.homeTeamName &&
            candidate.awayTeamName === match.awayTeamName &&
            candidate.homeGoals === match.homeGoals &&
            candidate.awayGoals === match.awayGoals &&
            (candidate.homePenalties !== undefined ||
              candidate.awayPenalties !== undefined),
        )
    : undefined;
  const penalties = tie
    ? formatPenalties(tie.homePenalties, tie.awayPenalties)
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <Link
        to="/status"
        data-ocid="match.back_link"
        className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-smooth hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to match status
      </Link>

      {id === null ? (
        <ErrorState message="That match reference is not valid." />
      ) : matchQuery.isLoading ? (
        <LoadingState label="Loading match" />
      ) : matchQuery.isError ? (
        <ErrorState
          message="We could not load this match."
          onRetry={() => void matchQuery.refetch()}
        />
      ) : !match ? (
        <ErrorState message="This match could not be found. It may have been removed." />
      ) : (
        <>
          <PageHeader
            eyebrow={`Matchday ${match.matchday.toString()}`}
            title={`${match.homeTeamName} vs ${match.awayTeamName}`}
            description="Full match detail, including the current score and scheduled kickoff."
            actions={<StatusBadge status={match.status} />}
          />

          <section
            data-ocid="match.scoreboard"
            className="overflow-hidden rounded-lg border border-border bg-pitch-lines"
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-card/80 px-4 py-8 sm:px-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <TeamCrest
                  name={match.homeTeamName}
                  shortCode={match.homeTeamName}
                  size="lg"
                />
                <p className="font-display text-base font-bold text-foreground sm:text-lg">
                  {match.homeTeamName}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Home
                </p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <p className="font-mono text-4xl font-bold tabular text-foreground sm:text-5xl">
                  {match.homeGoals?.toString() ?? "–"}
                  <span className="px-2 text-muted-foreground">:</span>
                  {match.awayGoals?.toString() ?? "–"}
                </p>
                {penalties ? (
                  <p
                    data-ocid="match.penalties"
                    className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary"
                  >
                    {penalties}
                  </p>
                ) : null}
                <StatusBadge status={match.status} />
              </div>

              <div className="flex flex-col items-center gap-3 text-center">
                <TeamCrest
                  name={match.awayTeamName}
                  shortCode={match.awayTeamName}
                  size="lg"
                />
                <p className="font-display text-base font-bold text-foreground sm:text-lg">
                  {match.awayTeamName}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Away
                </p>
              </div>
            </div>
          </section>

          {tie?.winnerTeamName ? (
            <p
              data-ocid="match.advanced_team"
              className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-center font-display text-sm font-semibold text-primary"
            >
              {tie.winnerTeamName} advanced
              {penalties ? " on penalties" : ""}
            </p>
          ) : null}

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Kickoff
                </dt>
                <dd className="font-display text-sm font-semibold text-foreground">
                  {formatKickoff(match.kickoff)}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
                <Hash className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Matchday
                </dt>
                <dd className="font-display text-sm font-semibold text-foreground">
                  {match.matchday.toString()}
                </dd>
              </div>
            </div>
          </dl>
        </>
      )}
    </div>
  );
}
