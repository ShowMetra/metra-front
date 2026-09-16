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
    const code = searchParams.get("code");
    const next = safeNextPath(searchParams.get("next"));
    if (!code) {
      router.replace(next);
      return;
    }
    void getSupabaseBrowserClient().auth.exchangeCodeForSession(code).then(({ error: authError }) => {
      if (authError) setError(authError.message);
      else router.replace(next);
    }).catch((caught) => setError(errorMessage(caught)));
  }, [router, searchParams]);

  return <main className="shell grid min-h-screen place-items-center"><div className="card w-full max-w-md p-8 text-center"><Brand /><p className="muted mt-6">Completing sign in…</p>{error && <div className="error-box mt-4">{error}</div>}</div></main>;
}

export default function AuthCallbackPage() {
  return <Suspense fallback={<main className="shell py-20">Completing sign in…</main>}><Callback /></Suspense>;
}
