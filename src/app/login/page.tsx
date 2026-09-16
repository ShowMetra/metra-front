"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Brand } from "@/components/brand";
import { ConfigNotice } from "@/components/config-notice";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { errorMessage, safeNextPath } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEmail(event: FormEvent) {
    event.preventDefault();
    if (!hasSupabaseConfig()) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace(next);
        router.refresh();
      } else {
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } });
        if (authError) throw authError;
        if (data.session) router.replace(next);
        else setMessage("Check your inbox to confirm the email address, then return to this page.");
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    if (!hasSupabaseConfig()) return;
    setBusy(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: authError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (authError) throw authError;
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <main className="shell grid min-h-screen place-items-center py-10">
      <section className="card grid w-full max-w-4xl overflow-hidden md:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-[#163b2d] p-10 text-white md:flex md:flex-col md:justify-between">
          <Brand href="/" />
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#a9d7bf]">One review loop</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">From curtain call to a clearer next show.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#d4e7dc]">Create performances, share one review link, and see guest feedback in a consistent scorecard.</p>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8 md:hidden"><Brand href="/" /></div>
          <p className="eyebrow">Agency & guest access</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{mode === "sign-in" ? "Welcome back" : "Create your account"}</h2>
          <p className="muted mt-2 text-sm">{next.startsWith("/r/") ? "Sign in to continue your review." : "Sign in to manage shows and performances."}</p>

          <div className="mt-6"><ConfigNotice /></div>
          <form onSubmit={handleEmail} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Email<input className="field mt-1.5" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label className="block text-sm font-medium">Password<input className="field mt-1.5" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {error && <div className="error-box">{error}</div>}
            {message && <div className="success-box">{message}</div>}
            <button className="button-primary w-full" disabled={busy || !hasSupabaseConfig()}>{busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}</button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-[#7a847d]"><span className="h-px flex-1 bg-[#dfe5dd]" />or<span className="h-px flex-1 bg-[#dfe5dd]" /></div>
          <button type="button" className="button-secondary w-full" onClick={handleGoogle} disabled={busy || !hasSupabaseConfig()}>Continue with Google</button>
          <p className="muted mt-5 text-center text-sm">
            {mode === "sign-in" ? "New to ShowMetra? " : "Already have an account? "}
            <button type="button" className="font-semibold text-[#176c4c]" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(null); setMessage(null); }}>{mode === "sign-in" ? "Create account" : "Sign in"}</button>
          </p>
          {next.startsWith("/r/") && <p className="mt-4 text-center text-sm"><Link className="muted underline" href={next}>Back to the show</Link></p>}
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="shell py-20">Loading…</main>}><LoginForm /></Suspense>;
}
