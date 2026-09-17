"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { errorMessage, safeNextPath } from "@/lib/utils";

function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      try {
        const supabase = getSupabaseBrowserClient();
        const code = searchParams.get("code");
        const next = safeNextPath(searchParams.get("next"));

        if (code) {
          const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
          if (authError) throw authError;
        } else {
          const { data, error: authError } = await supabase.auth.getSession();
          if (authError) throw authError;
          if (!data.session) throw new Error("The sign-in session was not returned. Please try signing in again.");
        }

        if (active) router.replace(next);
      } catch (caught) {
        if (active) setError(errorMessage(caught));
      }
    }

    void completeSignIn();
    return () => { active = false; };
  }, [router, searchParams]);

  return <main className="shell grid min-h-screen place-items-center"><div className="card w-full max-w-md p-8 text-center"><Brand /><p className="muted mt-6">Completing sign in…</p>{error && <div className="error-box mt-4">{error}</div>}</div></main>;
}

export default function AuthCallbackPage() {
  return <Suspense fallback={<main className="shell py-20">Completing sign in…</main>}><Callback /></Suspense>;
}
