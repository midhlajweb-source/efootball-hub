import { MatchStatus } from "@/backend";
import { StatusBadge } from "@/components/StatusBadge";
import { TeamCrest } from "@/components/TeamCrest";
import { useStatusMatches, useTournamentState } from "@/hooks/useTournament";
import { formatKickoff } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  ListOrdered,
  Radio,
  Swords,
} from "lucide-react";

const QUICK_LINKS = [
  {
    to: "/status" as const,
    label: "Match Status",
    description: "Upcoming, live, and completed fixtures at a glance.",
    icon: Radio,
  },
  {
    to: "/table" as const,
    label: "League Table",
    description:
      "Standings ranked by points, goal difference, then goals scored.",
    icon: ListOrdered,
  },
  {
    to: "/bracket" as const,
    label: "Knockout Bracket",
    description: "Round of 16 through to the Final, with winners advancing.",
    icon: Swords,
  },
];

export function HomePage() {
  const stateQuery = useTournamentState();
  const statusQuery = useStatusMatches();

  const tournamentName = stateQuery.data?.tournamentName ?? "eFootball Cup";
  const stageLabel =
    stateQuery.data?.stageLabel ?? "Awaiting stage announcement";
  const live = statusQuery.data?.live ?? [];
  const upcoming = statusQuery.data?.upcoming ?? [];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-pitch-lines">
        <div
          className="absolute inset-0 bg-gradient-subtle"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              <span
                className="h-1.5 w-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              Live tournament hub
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              {tournamentName}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Every fixture, every table point, and every knockout tie — updated
              the moment the control room enters a result.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/status"
                data-ocid="home.status_primary_button"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground transition-smooth hover:opacity-90"
              >
                View match status
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/bracket"
                data-ocid="home.bracket_secondary_button"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-foreground transition-smooth hover:border-primary/50 hover:text-primary"
              >
                Knockout bracket
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Current stage
              </p>
              <p
                data-ocid="home.stage_label"
                className="font-display text-lg font-semibold text-foreground"
              >
                {stageLabel}
              </p>
            </div>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {live.length} live · {upcoming.length} upcoming
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                data-ocid={`home.quick_link.${link.label.toLowerCase().replace(/\s+/g, "_")}`}
                className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-smooth hover:border-primary/50 hover:shadow-elevated"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-display text-lg font-semibold text-foreground">
                  {link.label}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {link.description}
                </span>
                <span className="mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Open
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-[0.12em] text-foreground">
            {live.length > 0 ? "On the pitch now" : "Next up"}
          </h2>
          <Link
            to="/status"
            data-ocid="home.status_link"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary transition-smooth hover:opacity-80"
          >
            All matches
          </Link>
        </div>

        {live.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {live.slice(0, 4).map((match) => (
              <li key={match.id.toString()}>
                <Link
                  to="/match/$matchId"
                  params={{ matchId: match.id.toString() }}
                  data-ocid="home.live_match_card"
                  className="flex items-center justify-between gap-4 rounded-lg border border-accent/40 bg-card p-4 transition-smooth hover:border-accent"
                >
                  <div className="min-w-0 space-y-2">
                    <StatusBadge status={MatchStatus.live} />
                    <p className="truncate font-display text-sm font-semibold text-foreground">
                      {match.homeTeamName}{" "}
                      <span className="text-muted-foreground">vs</span>{" "}
                      {match.awayTeamName}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-2xl font-bold tabular text-accent">
                    {match.homeGoals?.toString() ?? "–"}
                    <span className="px-1 text-muted-foreground">:</span>
                    {match.awayGoals?.toString() ?? "–"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : upcoming.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {upcoming.slice(0, 4).map((match) => (
              <li key={match.id.toString()}>
                <Link
                  to="/match/$matchId"
                  params={{ matchId: match.id.toString() }}
                  data-ocid="home.upcoming_match_card"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-smooth hover:border-primary/50"
                >
                  <TeamCrest
                    name={match.homeTeamName}
                    shortCode={match.homeTeamName}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-foreground">
                      {match.homeTeamName}{" "}
                      <span className="text-muted-foreground">vs</span>{" "}
                      {match.awayTeamName}
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {formatKickoff(match.kickoff)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div
            data-ocid="home.empty_state"
            className="rounded-lg border border-dashed border-border bg-card/60 px-6 py-10 text-center"
          >
            <p className="font-display text-base font-semibold text-foreground">
              No fixtures scheduled yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The control room is still building the schedule. Check back
              shortly.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
