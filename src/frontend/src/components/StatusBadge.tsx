import { MatchStatus } from "@/backend";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: MatchStatus;
  className?: string;
}

const STATUS_STYLE: Record<MatchStatus, string> = {
  [MatchStatus.live]: "border-accent/50 bg-accent/15 text-accent",
  [MatchStatus.upcoming]: "border-border bg-secondary text-muted-foreground",
  [MatchStatus.completed]: "border-primary/40 bg-primary/10 text-primary",
};

const STATUS_LABEL: Record<MatchStatus, string> = {
  [MatchStatus.live]: "Live",
  [MatchStatus.upcoming]: "Upcoming",
  [MatchStatus.completed]: "Full time",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isLive = status === MatchStatus.live;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]",
        STATUS_STYLE[status],
        className,
      )}
    >
      {isLive ? (
        <span
          className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-accent"
          aria-hidden="true"
        />
      ) : null}
      {STATUS_LABEL[status]}
    </span>
  );
}
