import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, ShieldCheck, Trophy } from "lucide-react";

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/teams", label: "Teams", icon: ShieldCheck },
  { to: "/admin/fixtures", label: "Fixtures", icon: Trophy },
  { to: "/admin/knockout", label: "Knockout", icon: Trophy },
] as const;

interface AdminLayoutProps {
  children: React.ReactNode;
  username: string;
  onLogout: () => void;
}

export function AdminLayout({
  children,
  username,
  onLogout,
}: AdminLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    void navigate({ to: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="border-b border-sidebar-border bg-sidebar lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:flex-col lg:items-stretch lg:gap-6 lg:px-5 lg:py-6">
          <Link
            to="/admin"
            data-ocid="admin.brand_link"
            className="flex items-center gap-2.5 transition-smooth hover:opacity-90"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-sm font-bold uppercase tracking-[0.16em] text-sidebar-foreground">
                Control Room
              </span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {username}
              </span>
            </span>
          </Link>

          <nav aria-label="Admin sections" className="hidden lg:block">
            <ul className="flex flex-col gap-1">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      data-ocid={`admin.nav.${item.label.toLowerCase()}_link`}
                      activeOptions={{ exact: item.to === "/admin" }}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/70 transition-smooth hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      activeProps={{
                        className: "bg-sidebar-accent text-sidebar-primary",
                      }}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            type="button"
            data-ocid="admin.logout_button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md border border-sidebar-border px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/80 transition-smooth hover:border-destructive/60 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>

          <ThemeToggle className="border-sidebar-border text-sidebar-foreground/80 hover:border-sidebar-primary/60 hover:text-sidebar-primary" />
        </div>

        <nav
          aria-label="Admin sections mobile"
          className="border-t border-sidebar-border lg:hidden"
        >
          <ul className="flex gap-1 overflow-x-auto px-3 py-2">
            {ADMIN_NAV.map((item) => (
              <li key={item.to} className="shrink-0">
                <Link
                  to={item.to}
                  data-ocid={`admin.nav.mobile_${item.label.toLowerCase()}_link`}
                  activeOptions={{ exact: item.to === "/admin" }}
                  className="block rounded-md px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70 transition-smooth hover:bg-sidebar-accent"
                  activeProps={{
                    className: "bg-sidebar-accent text-sidebar-primary",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className={cn("min-w-0 flex-1 bg-background")}>
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
