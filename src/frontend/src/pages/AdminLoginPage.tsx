import { useAdminSession } from "@/hooks/useAdminSession";
import { errorMessage } from "@/lib/api";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function AdminLoginPage() {
  const { login, isAuthenticated } = useAdminSession();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    login.mutate(
      { username, password },
      {
        onSuccess: () => {
          void navigate({ to: "/admin" });
        },
        onError: (mutationError) => {
          setError(errorMessage(mutationError));
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center bg-pitch-lines px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-bold uppercase tracking-[0.14em] text-foreground">
              Control Room
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage teams, fixtures, and knockout ties.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            data-ocid="admin.login_form"
            className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-elevated"
          >
            <div className="space-y-2">
              <label
                htmlFor="admin-username"
                className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Username
              </label>
              <input
                id="admin-username"
                name="username"
                data-ocid="admin.username_input"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="Enter admin username"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                data-ocid="admin.password_input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="Enter admin password"
              />
            </div>

            {error ? (
              <p
                data-ocid="admin.login_error"
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              data-ocid="admin.login_submit_button"
              disabled={
                login.isPending || username.trim() === "" || password === ""
              }
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-primary-foreground transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              {login.isPending ? "Signing in…" : "Sign in"}
            </button>

            {isAuthenticated ? (
              <p className="text-center text-xs text-muted-foreground">
                Already signed in.{" "}
                <Link to="/admin" className="text-primary hover:underline">
                  Go to the control room
                </Link>
              </p>
            ) : null}
          </form>

          <p className="mt-6 text-center">
            <Link
              to="/"
              data-ocid="admin.back_home_link"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-smooth hover:text-primary"
            >
              Back to tournament hub
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
