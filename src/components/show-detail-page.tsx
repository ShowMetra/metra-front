"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Database } from "@/lib/database.types";
import { absoluteAppUrl, reviewPath } from "@/lib/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { errorMessage, formatDate } from "@/lib/utils";

type Show = Database["public"]["Tables"]["shows"]["Row"];
type Performance = Database["public"]["Tables"]["performances"]["Row"];
type ReviewLink = Database["public"]["Tables"]["review_links"]["Row"];

export function ShowDetailPage({ id }: { id: string }) {
  const [show, setShow] = useState<Show | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [reviewLinks, setReviewLinks] = useState<ReviewLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [venueName, setVenueName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [busy, setBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [openQrToken, setOpenQrToken] = useState<string | null>(null);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  useEffect(() => {
    if (!openQrToken) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenQrToken(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [openQrToken]);

  const load = useCallback(async () => {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const [showResult, performanceResult] = await Promise.all([
      supabase.from("shows").select("*").eq("id", id).single(),
      supabase.from("performances").select("*").eq("show_id", id).order("starts_at", { ascending: false }),
    ]);
    if (showResult.error) { setError(showResult.error.message); setLoading(false); return; }
    if (performanceResult.error) { setError(performanceResult.error.message); setLoading(false); return; }
    const performanceData = performanceResult.data ?? [];
    setShow(showResult.data);
    setPerformances(performanceData);
    if (performanceData.length) {
      const { data, error: linksError } = await supabase.from("review_links").select("*").in("performance_id", performanceData.map((performance) => performance.id)).order("created_at", { ascending: false });
      if (linksError) setError(linksError.message);
      setReviewLinks(data ?? []);
    } else setReviewLinks([]);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function createPerformance(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const parsed = new Date(startsAt);
      if (Number.isNaN(parsed.getTime())) throw new Error("Choose a valid performance date and time.");
      const { error: insertError } = await getSupabaseBrowserClient().from("performances").insert({
        show_id: id,
        starts_at: parsed.toISOString(),
        timezone,
        venue_name: venueName.trim() || null,
        status: "scheduled",
      });
      if (insertError) throw insertError;
      setStartsAt("");
      setVenueName("");
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function generateReviewLink(performanceId: string) {
    setLinkBusy(performanceId);
    setError(null);
    try {
      const { error: insertError } = await getSupabaseBrowserClient().from("review_links").insert({ performance_id: performanceId, is_active: true });
      if (insertError) throw insertError;
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLinkBusy(null);
    }
  }

  async function copyLink(token: string) {
    const url = absoluteAppUrl(reviewPath(token));
    await navigator.clipboard.writeText(url);
    setCopied(token);
    window.setTimeout(() => setCopied(null), 1600);
  }

  if (loading) return <p className="muted">Loading show…</p>;
  if (!show) return <div className="error-box">{error || "Show not found."}</div>;

  return (
    <>
      <Link href="/dashboard/shows" className="muted text-sm hover:text-[#176c4c]">← Back to shows</Link>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">{show.status}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{show.title}</h1><p className="muted mt-2 max-w-2xl">{show.description || "No description"}</p></div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${show.status === "published" ? "bg-[#e9f5ee] text-[#0f5138]" : "bg-[#f0f1ee] text-[#68736c]"}`}>{show.status}</span>
      </div>
      {show.status !== "published" && <div className="info-box mt-6">Public review links resolve only after this show is published.</div>}
      {error && <div className="error-box mt-6">{error}</div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="card p-6">
          <h2 className="text-lg font-semibold">Add performance</h2>
          <p className="muted mt-1 text-sm">Each performance can have one or more guest links.</p>
          <form onSubmit={createPerformance} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">Start date and time<input className="field mt-1.5" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></label>
            <label className="block text-sm font-medium">Timezone<input className="field mt-1.5" value={timezone} onChange={(event) => setTimezone(event.target.value)} required /></label>
            <label className="block text-sm font-medium">Venue <span className="muted font-normal">(optional)</span><input className="field mt-1.5" value={venueName} onChange={(event) => setVenueName(event.target.value)} maxLength={200} placeholder="Marina Hotel Theatre" /></label>
            <button className="button-primary" disabled={busy}>{busy ? "Adding…" : "Add performance"}</button>
          </form>
        </section>

        <section>
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Performances</h2><p className="muted mt-1 text-sm">Generate a public review link when the performance is ready.</p></div></div>
          {performances.length === 0 ? <div className="card mt-5 p-7 text-center text-sm text-[#68736c]">No performances yet.</div> : (
            <div className="mt-5 space-y-4">
              {performances.map((performance) => {
                const links = reviewLinks.filter((link) => link.performance_id === performance.id);
                return (
                  <article key={performance.id} className="card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h3 className="font-semibold">{formatDate(performance.starts_at, performance.timezone)}</h3><p className="muted mt-1 text-sm">{performance.venue_name || "Venue not set"} · {performance.timezone}</p></div>
                      <button type="button" className="button-secondary text-sm" onClick={() => generateReviewLink(performance.id)} disabled={linkBusy === performance.id}>{linkBusy === performance.id ? "Generating…" : "Generate review link"}</button>
                    </div>
                    {links.length > 0 && <div className="mt-4 space-y-2 border-t border-[#e3e8e3] pt-4">{links.map((link) => (
                      <div key={link.id} className="flex items-center gap-2 rounded-xl bg-[#f5f7f4] p-2.5 pl-3">
                        <code className="min-w-0 flex-1 truncate text-xs">{reviewPath(link.token)}</code>
                        <span className={`text-xs font-semibold ${link.is_active ? "text-[#176c4c]" : "text-[#a83f35]"}`}>{link.is_active ? "Active" : "Inactive"}</span>
                        <button type="button" className="button-ghost min-h-8 px-2 text-xs" onClick={() => copyLink(link.token)}>{copied === link.token ? "Copied" : "Copy"}</button>
                        <button type="button" className="button-ghost min-h-8 px-2 text-xs" onClick={() => setOpenQrToken(link.token)}>Open</button>
                      </div>
                    ))}</div>}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {openQrToken && (
        <QrModal
          token={openQrToken}
          copied={copied === openQrToken}
          onClose={() => setOpenQrToken(null)}
          onCopy={() => copyLink(openQrToken)}
        />
      )}
    </>
  );
}

function QrModal({ token, copied, onClose, onCopy }: { token: string; copied: boolean; onClose: () => void; onCopy: () => void }) {
  const reviewUrl = absoluteAppUrl(reviewPath(token));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#101a15]/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-dialog-title"
      aria-describedby="qr-dialog-description"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="card relative w-full max-w-md p-6 text-center shadow-2xl sm:p-8">
        <button
          type="button"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-xl text-[#68736c] transition hover:bg-[#eef2ee] hover:text-[#17211c]"
          aria-label="Close QR code"
          onClick={onClose}
          autoFocus
        >
          ×
        </button>
        <p className="eyebrow">Guest review link</p>
        <h2 id="qr-dialog-title" className="mt-2 text-2xl font-semibold tracking-tight">Scan to review</h2>
        <p id="qr-dialog-description" className="muted mx-auto mt-2 max-w-xs text-sm leading-6">Guests can scan this code with their phone camera to open the review form.</p>

        <div className="mx-auto mt-6 w-fit rounded-2xl border border-[#dfe5dd] bg-white p-4 shadow-sm">
          <QRCodeSVG value={reviewUrl} size={220} level="M" marginSize={1} bgColor="#ffffff" fgColor="#17211c" title="ShowMetra guest review QR code" />
        </div>

        <code className="mt-5 block truncate rounded-xl bg-[#f5f7f4] px-3 py-2.5 text-left text-xs text-[#4f5a53]">{reviewUrl}</code>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" className="button-secondary" onClick={onCopy}>{copied ? "Copied" : "Copy link"}</button>
          <Link className="button-primary" href={reviewPath(token)} target="_blank" rel="noreferrer">Open review page</Link>
        </div>
      </div>
    </div>
  );
}
