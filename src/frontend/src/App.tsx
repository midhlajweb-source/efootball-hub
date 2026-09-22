import { Layout } from "@/components/Layout";
import { LoadingState } from "@/components/States";
import { useAdminSession } from "@/hooks/useAdminSession";
import { AdminBracketPage } from "@/pages/AdminBracketPage";
import { AdminFixturesPage } from "@/pages/AdminFixturesPage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminOverviewPage } from "@/pages/AdminOverviewPage";
import { AdminTeamsPage } from "@/pages/AdminTeamsPage";
import { BracketPage } from "@/pages/BracketPage";
import { HomePage } from "@/pages/HomePage";
import { MatchDetailPage } from "@/pages/MatchDetailPage";
import { StatusPage } from "@/pages/StatusPage";
import { TablePage } from "@/pages/TablePage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/",
  component: HomePage,
});

const statusRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/status",
  component: StatusPage,
});

const tableRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/table",
  component: TablePage,
});

const bracketRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/bracket",
  component: BracketPage,
});

const matchRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/match/$matchId",
  component: MatchDetailPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLoginPage,
});

/** Guards every admin route: unauthenticated visitors land on the login page. */
function AdminGuard() {
  const { isAuthenticated, isChecking, token } = useAdminSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      void navigate({ to: "/admin/login", replace: true });
    }
  }, [isChecking, isAuthenticated, navigate]);

  if (isChecking || (token && !isAuthenticated)) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <LoadingState label="Verifying admin session" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <Outlet />;
}

const adminGuardRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "admin-guard",
  component: AdminGuard,
});

const adminOverviewRoute = createRoute({
  getParentRoute: () => adminGuardRoute,
  path: "/admin",
  component: AdminOverviewPage,
});

const adminTeamsRoute = createRoute({
  getParentRoute: () => adminGuardRoute,
  path: "/admin/teams",
  component: AdminTeamsPage,
});

const adminFixturesRoute = createRoute({
  getParentRoute: () => adminGuardRoute,
  path: "/admin/fixtures",
  component: AdminFixturesPage,
});

const adminKnockoutRoute = createRoute({
  getParentRoute: () => adminGuardRoute,
  path: "/admin/knockout",
  component: AdminBracketPage,
});

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([
    homeRoute,
    statusRoute,
    tableRoute,
    bracketRoute,
    matchRoute,
  ]),
  adminLoginRoute,
  adminGuardRoute.addChildren([
    adminOverviewRoute,
    adminTeamsRoute,
    adminFixturesRoute,
    adminKnockoutRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
