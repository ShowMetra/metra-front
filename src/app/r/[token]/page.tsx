"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { ConfigNotice } from "@/components/config-notice";
import type { Database, HotelExperienceImpact, Json } from "@/lib/database.types";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { errorMessage, formatDate } from "@/lib/utils";

type ReviewContext = Database["public"]["Functions"]["resolve_review_link"]["Returns"][number];
type Summary = Database["public"]["Functions"]["get_show_rating_summary"]["Returns"][number];
type Breakdown = Database["public"]["Functions"]["get_show_rating_breakdown"]["Returns"];
type RatingCode = "performers" | "music" | "costumes" | "choreography" | "emotional_impact";

const criteria: Array<{ code: RatingCode; label: string }> = [
  { code: "performers", label: "Performers" },
  { code: "music", label: "Music" },
  { code: "costumes", label: "Costumes" },
  { code: "choreography", label: "Choreography" },
  { code: "emotional_impact", label: "Emotional Impact" },
];

const emptyRatings: Record<RatingCode, number> = {
  performers: 0,
  music: 0,
  costumes: 0,
  choreography: 0,
  emotional_impact: 0,
};

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [context, setContext] = useState<ReviewContext | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState(emptyRatings);
  const [hotelImpact, setHotelImpact] = useState<HotelExperienceImpact | "">("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown>([]);

  const loadSummary = useCallback(async (showId: string) => {
    const supabase = getSupabaseBrowserClient();
    const [summaryResult, breakdownResult] = await Promise.all([
      supabase.rpc("get_show_rating_summary", { p_show_id: showId }),
      supabase.rpc("get_show_rating_breakdown", { p_show_id: showId }),
    ]);
    if (summaryResult.error) throw summaryResult.error;
    if (breakdownResult.error) throw breakdownResult.error;
    setSummary(summaryResult.data?.[0] ?? null);
    setBreakdown(breakdownResult.data ?? []);
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig()) { setLoading(false); return; }
    const supabase = getSupabaseBrowserClient();
    void Promise.all([
      supabase.rpc("resolve_review_link", { p_token: token }),
      supabase.auth.getUser(),
    ]).then(([linkResult, authResult]) => {
      if (linkResult.error) setError(linkResult.error.message);
      else if (!linkResult.data?.[0]) setError("This review link is invalid, inactive, expired, or the show is not published.");
      else setContext(linkResult.data[0]);
      setUser(authResult.data.user ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!context || !hotelImpact) return;
    if (criteria.some(({ code }) => ratings[code] < 1)) {
      setError("Rate all five criteria before submitting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: submitError } = await getSupabaseBrowserClient().rpc("submit_review", {
        p_token: token,
        p_hotel_experience_impact: hotelImpact,
        p_comment: comment.trim() || null,
        p_ratings: ratings as unknown as Json,
      });
      if (submitError) throw submitError;
      await loadSummary(context.show_id);
      setSubmitted(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#dfe5dd] bg-white/85"><div className="shell flex min-h-16 items-center justify-between"><Brand href={`/r/${token}`} /><span className="muted text-xs">Guest review</span></div></header>
      <main className="shell py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <ConfigNotice />
          {loading && <p className="muted mt-8">Opening review…</p>}
          {error && <div className="error-box mt-6">{error}</div>}
          {context && (
            <>
              <section className="mb-7">
                <p className="eyebrow">{context.organization_name}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{context.show_title}</h1>
                <p className="muted mt-3">{formatDate(context.starts_at, context.timezone)}{context.venue_name ? ` · ${context.venue_name}` : ""}</p>
                {context.show_description && <p className="mt-4 max-w-2xl leading-7 text-[#4f5a53]">{context.show_description}</p>}
              </section>

              {!user ? (
                <section className="card p-6 sm:p-8"><h2 className="text-xl font-semibold">Sign in to leave your review</h2><p className="muted mt-2 text-sm leading-6">Your account keeps one review per performance and lets you update it later.</p><Link className="button-primary mt-5" href={`/login?next=${encodeURIComponent(`/r/${token}`)}`}>Continue to sign in</Link></section>
              ) : submitted ? (
                <RatingResults summary={summary} breakdown={breakdown} onEdit={() => setSubmitted(false)} />
              ) : (
                <form onSubmit={submit} className="card space-y-7 p-6 sm:p-8">
                  <div><h2 className="text-xl font-semibold">Rate the performance</h2><p className="muted mt-1 text-sm">1 is low, 5 is exceptional. All five ratings are required.</p></div>
                  <div className="space-y-5">
                    {criteria.map(({ code, label }) => (
                      <fieldset key={code} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <legend className="text-sm font-semibold sm:float-left">{label}</legend>
                        <div className="flex gap-2" aria-label={`${label} rating`}>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <label key={value} className={`grid size-10 cursor-pointer place-items-center rounded-xl border text-sm font-semibold transition ${ratings[code] === value ? "border-[#176c4c] bg-[#176c4c] text-white" : "border-[#cbd4cc] bg-white hover:border-[#176c4c]"}`}>
                              <input className="sr-only" type="radio" name={code} value={value} checked={ratings[code] === value} onChange={() => setRatings((current) => ({ ...current, [code]: value }))} required />{value}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                  <label className="block text-sm font-semibold">How did the show affect your hotel experience?<select className="field mt-2" value={hotelImpact} onChange={(event) => setHotelImpact(event.target.value as HotelExperienceImpact)} required><option value="">Choose one</option><option value="significantly">Improved it significantly</option><option value="somewhat">Improved it somewhat</option><option value="no_difference">Made no difference</option><option value="no">Did not improve it</option></select></label>
                  <label className="block text-sm font-semibold">Comment <span className="muted font-normal">(optional)</span><textarea className="field mt-2 min-h-28 resize-y" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={4000} placeholder="What stood out to you?" /></label>
                  <button className="button-primary w-full sm:w-auto" disabled={busy}>{busy ? "Submitting…" : "Submit review"}</button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function RatingResults({ summary, breakdown, onEdit }: { summary: Summary | null; breakdown: Breakdown; onEdit: () => void }) {
  return (
    <section className="card p-6 sm:p-8">
      <div className="success-box">Thank you — your review has been saved.</div>
      <div className="mt-7 flex items-end gap-3"><span className="text-5xl font-semibold tracking-tight">{summary?.overall_rating?.toFixed(2) ?? "—"}</span><span className="muted pb-1 text-sm">overall · {summary?.reviews_count ?? 0} review{summary?.reviews_count === 1 ? "" : "s"}</span></div>
      <div className="mt-7 space-y-4">
        {breakdown.map((item) => (
          <div key={item.criterion_code} className="grid grid-cols-[1fr_auto] gap-3 text-sm">
            <span>{item.criterion_name}</span><strong>{item.average_rating?.toFixed(2) ?? "—"}</strong>
            <div className="col-span-2 h-2 overflow-hidden rounded-full bg-[#e8ece8]"><div className="h-full rounded-full bg-[#176c4c]" style={{ width: `${((item.average_rating ?? 0) / 5) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <button type="button" className="button-secondary mt-7" onClick={onEdit}>Edit my review</button>
    </section>
  );
}
