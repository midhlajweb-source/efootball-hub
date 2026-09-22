import { teamMonogram } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TeamCrestProps {
  name: string;
  shortCode: string;
  crestUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<TeamCrestProps["size"]>, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
};

export function TeamCrest({
  name,
  shortCode,
  crestUrl,
  size = "md",
  className,
}: TeamCrestProps) {
  const base = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary font-display font-bold uppercase tracking-wider text-secondary-foreground",
    SIZE_CLASS[size],
    className,
  );

  if (crestUrl) {
    return (
      <span className={base}>
        <img
          src={crestUrl}
          alt={`${name} crest`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span className={base} aria-hidden="true">
      {teamMonogram(shortCode, name)}
    </span>
  );
}
