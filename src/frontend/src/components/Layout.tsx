import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Menu, Trophy, X } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/status", label: "Status" },
  { to: "/table", label: "League Table" },
  { to: "/bracket", label: "Knockout" },
] as const;

export function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            data-ocid="nav.home_link"
            className="flex min-w-0 items-center gap-2.5 transition-smooth hover:opacity-90"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold uppercase tracking-[0.16em] text-foreground">
                eFootball Cup
              </span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Tournament Hub
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "_")}_link`}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-primary" }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/admin"
              data-ocid="nav.admin_link"
              className="ml-2 rounded-md border border-border px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-smooth hover:border-primary/50 hover:text-primary"
            >
              Admin
            </Link>
            <ThemeToggle className="ml-1" />
          </nav>

          <button
            type="button"
            data-ocid="nav.menu_toggle"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground transition-smooth hover:border-primary/50 hover:text-primary md:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {menuOpen ? (
          <nav
            className="border-t border-border bg-card px-4 py-3 md:hidden"
            aria-label="Mobile primary"
          >
            <ul className="flex flex-col gap-1">
              {[...NAV_ITEMS, { to: "/admin", label: "Admin" } as const].map(
                (item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      data-ocid={`nav.mobile_${item.label.toLowerCase().replace(/\s+/g, "_")}_link`}
                      activeOptions={{ exact: item.to === "/" }}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-md px-3 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
                      activeProps={{ className: "bg-secondary text-primary" }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
              <li className="mt-1 border-t border-border pt-2">
                <ThemeToggle
                  className="h-11 w-11"
                  onToggle={() => setMenuOpen(false)}
                />
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <main className={cn("flex-1 bg-background")}>{children}</main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            eFootball Cup · Season 2026
          </p>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground transition-smooth hover:text-primary"
          >
            © {new Date().getFullYear()}. Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
