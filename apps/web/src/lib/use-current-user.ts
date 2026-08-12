"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicUser } from "@nora/types";
import { API_ROUTES, authFetch } from "./api";
import { getTokens } from "./auth-store";

export function useCurrentUser() {
  return useQuery<PublicUser | null>({
    queryKey: ["me"],
    queryFn: async () => {
      if (!getTokens()) return null;
      const res = await authFetch(API_ROUTES.me);
      if (!res.ok) return null;
      return res.json();
    },
  });
}
