import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "efootball.admin.token";

/**
 * Admin session token. The token itself is a local credential (like a cookie),
 * while the backend remains the authority that validates it on every write.
 */
export function useAdminSession() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  });

  const sessionQuery = useQuery({
    queryKey: ["adminSession", token],
    queryFn: async () => {
      if (!actor || !token) return null;
      const valid = await actor.isAdminSession(token);
      return valid ? token : null;
    },
    enabled: !!actor && !isFetching && !!token,
    retry: false,
  });

  // A token the backend rejects is stale — drop it so the login page shows.
  useEffect(() => {
    if (token && sessionQuery.isSuccess && sessionQuery.data === null) {
      window.localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, [token, sessionQuery.isSuccess, sessionQuery.data]);

  const login = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      const session = await actor.adminLogin(
        credentials.username,
        credentials.password,
      );
      if (!session) throw new Error("Incorrect username or password.");
      return session;
    },
    onSuccess: (session) => {
      window.localStorage.setItem(TOKEN_KEY, session.token);
      setToken(session.token);
      void queryClient.invalidateQueries({ queryKey: ["adminSession"] });
    },
  });

  const logout = useCallback(async () => {
    const current = token;
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    queryClient.removeQueries({ queryKey: ["adminSession"] });
    if (actor && current) {
      try {
        await actor.adminLogout(current);
      } catch {
        // The local session is already cleared; a failed revoke is not user-facing.
      }
    }
  }, [actor, token, queryClient]);

  const isAuthenticated = !!token && sessionQuery.data === token;

  return {
    token,
    isAuthenticated,
    isChecking: !!token && sessionQuery.isLoading,
    login,
    logout,
  };
}
