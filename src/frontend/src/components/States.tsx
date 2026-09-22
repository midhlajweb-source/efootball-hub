import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({
  label = "Loading",
  className,
}: { label?: string; className?: string }) {
  return (
    <div
      data-ocid="loading_state"
      className={cn(
        "flex items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2
        className="h-4 w-4 animate-spin text-primary"
        aria-hidden="true"
      />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      data-ocid="error_state"
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-8",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <p className="font-display text-sm font-semibold uppercase tracking-wider">
          Could not load data
        </p>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          type="button"
          data-ocid="error_state.retry_button"
          onClick={onRetry}
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-foreground transition-smooth hover:border-primary/50 hover:text-primary"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-ocid="empty_state"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary">
        <span
          className="font-display text-lg font-bold text-primary"
          aria-hidden="true"
        >
          ⚽
        </span>
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
