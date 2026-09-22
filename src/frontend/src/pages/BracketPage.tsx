import type { BracketRoundView, TieView } from "@/backend";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { TeamCrest } from "@/components/TeamCrest";
import { useBracket } from "@/hooks/useTournament";
import {
  KNOCKOUT_ROUND_LABEL,
  KNOCKOUT_ROUND_ORDER,
  formatPenalties,
  isLevelAfterNormalTime,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

function TieCard({ tie, index }: { tie: TieView; index: number }) {
  const hasWinner = !!tie.winnerTeamName;
  const homeWon = hasWinner && tie.winnerTeamName === tie.homeTeamName;
  const awayWon = hasWinner && tie.winnerTeamName === tie.awayTeamName;
  const penalties = formatPenalties(tie.homePenalties, tie.awayPenalties);
  const decidedOnPenalties =
    penalties !== null && isLevelAfterNormalTime(tie.homeGoals, tie.awayGoals);

  const side = (
    name: string | undefined,
    goals: bigint | undefined,
    pens: bigint | undefined,
    isWinner: boolean,
  ) => (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5",
        isWinner && "bg-primary/10",
      )}
    >
      {name ? (
        <TeamCrest name={name} shortCode={name} size="sm" />
      ) : (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-border font-mono text-[10px] text-muted-foreground"
          aria-hidden="true"
        >
          ?
        </span>
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-display text-sm",
          name
            ? "font-semibold text-foreground"
            : "italic text-muted-foreground",
          isWinner && "text-primary",
        )}
      >
        {name ?? "To be decided"}
      </span>
      <span className="flex shrink-0 items-baseline gap-1.5">
        <span
          className={cn(
            "font-mono text-base font-bold tabular",
            isWinner ? "text-primary" : "text-foreground",
          )}
        >
          {goals?.toString() ?? "–"}
        </span>
        {pens !== undefined ? (
          <span
            className={cn(
              "font-mono text-[11px] tabular",
              isWinner ? "text-primary" : "text-muted-foreground",
            )}
          >
            ({pens.toString()})
          </span>
        ) : null}
      </span>
    </div>
  );

  return (
    <article
      data-ocid={`bracket.tie.${index + 1}`}
      className={cn(
        "w-full overflow-hidden rounded-lg border bg-card transition-smooth",
        hasWinner ? "border-primary/40" : "border-border",
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Tie {tie.slot.toString()}
        </span>
        {hasWinner ? (
          <span
            data-ocid={`bracket.tie_advanced.${index + 1}`}
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary"
          >
            {decidedOnPenalties ? "Advanced on pens" : "Advanced"}
          </span>
        ) : null}
      </div>
      <div className="divide-y divide-border">
        {side(tie.homeTeamName, tie.homeGoals, tie.homePenalties, homeWon)}
        {side(tie.awayTeamName, tie.awayGoals, tie.awayPenalties, awayWon)}
      </div>
      {penalties !== null ? (
        <p
          data-ocid={`bracket.tie_penalties.${index + 1}`}
          className="border-t border-border bg-secondary/40 px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
        >
          {penalties}
        </p>
      ) : null}
    </article>
  );
}

function RoundColumn({
  round,
  index,
}: { round: BracketRoundView; index: number }) {
  const isFinal =
    round.round === KNOCKOUT_ROUND_ORDER[KNOCKOUT_ROUND_ORDER.length - 1];
  return (
    <section
      data-ocid={`bracket.round.${index + 1}`}
      className="flex w-[260px] shrink-0 flex-col gap-3 sm:w-[280px]"
    >
      <header
        className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2",
          isFinal
            ? "border-primary/50 bg-primary/10"
            : "border-border bg-secondary/60",
        )}
      >
        {isFinal ? (
          <Trophy className="h-4 w-4 text-primary" aria-hidden="true" />
        ) : null}
        <h2
          className={cn(
            "font-display text-xs font-bold uppercase tracking-[0.16em]",
            isFinal ? "text-primary" : "text-foreground",
          )}
        >
          {KNOCKOUT_ROUND_LABEL[round.round]}
        </h2>
        <span className="ml-auto font-mono text-[10px] tabular text-muted-foreground">
          {round.ties.length}
        </span>
      </header>
      <div className="flex flex-1 flex-col justify-around gap-3">
        {round.ties.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card/60 px-3 py-6 text-center text-xs text-muted-foreground">
            No ties drawn
          </p>
        ) : (
          round.ties.map((tie, tieIndex) => (
            <TieCard key={tie.id.toString()} tie={tie} index={tieIndex} />
          ))
        )}
      </div>
    </section>
  );
}

export function BracketPage() {
  const bracketQuery = useBracket();
  const rounds = bracketQuery.data ?? [];
  const hasTies = rounds.some((round) => round.ties.length > 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Knockout Stage"
        title="Knockout Bracket"
        description="Round of 16 through to the Final. Winners advance automatically the moment a tie result is entered."
      />

      {bracketQuery.isLoading ? (
        <LoadingState label="Loading bracket" />
      ) : bracketQuery.isError ? (
        <ErrorState
          message="We could not load the knockout bracket."
          onRetry={() => void bracketQuery.refetch()}
        />
      ) : !hasTies ? (
        <EmptyState
          title="Bracket not drawn yet"
          description="Once the league stage concludes, the control room draws the knockout ties and they appear here."
        />
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-6">
            {rounds.map((round, index) => (
              <RoundColumn key={round.round} round={round} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
