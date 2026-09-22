import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  /** Optional callback fired after the theme flips (e.g. to close a mobile menu). */
  onToggle?: () => void;
}

/**
 * Icon-only sun/moon control. The label describes the action the click performs,
 * so screen-reader users hear "Switch to light theme" while in dark mode.
 */
export function ThemeToggle({ className, onToggle }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      data-ocid="nav.theme_toggle"
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      onClick={() => {
        toggleTheme();
        onToggle?.();
      }}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-smooth hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
