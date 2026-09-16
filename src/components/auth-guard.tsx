"use client";

import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";

export function AuthGuard({ children }: { children: (user: User) => React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      setUser(data.user);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    });
    return () => data.subscription.unsubscribe();
  }, [pathname, router]);

  if (!hasSupabaseConfig()) {
    return <div className="info-box">Supabase environment variables are required to open the agency dashboard.</div>;
  }
  if (loading || !user) return <div className="muted py-10 text-sm">Checking your session…</div>;
  return children(user);
}
