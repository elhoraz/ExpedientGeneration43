"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  userId: string | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setUser(data.user ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
      })
      .finally(() => {
        if (mounted) setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userId: user?.id ?? null,
      isLoggedIn: Boolean(user),
      isAuthLoading,
      supabase,
    }),
    [user, isAuthLoading, supabase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

let fallbackClient: SupabaseClient | null = null;

function getFallbackClient(): SupabaseClient {
  if (!fallbackClient) {
    fallbackClient = createClient();
  }
  return fallbackClient;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    return {
      user: null,
      userId: null,
      isLoggedIn: false,
      isAuthLoading: true,
      supabase: getFallbackClient(),
    };
  }

  return ctx;
}
