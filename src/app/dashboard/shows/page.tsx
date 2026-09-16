"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Database } from "@/lib/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useCurrentOrganization } from "@/lib/use-current-organization";

type Show = Database["public"]["Tables"]["shows"]["Row"];

export default function ShowsPage() {
  const { organization, loading: organizationLoading, error: organizationError } = useCurrentOrganization();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationLoading) return;
    if (!organization) { setLoading(false); return; }
    void getSupabaseBrowserClient().from("shows").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false })
      .then(({ data, error: showsError }) => {
        if (showsError) setError(showsError.message);
        setShows(data ?? []);
        setLoading(false);
      });
  }, [organization, organizationLoading]);

  if (organizationError) return <div className="error-box">{organizationError}</div>;
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Catalogue</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Shows</h1><p className="muted mt-2">Published shows can accept guest reviews through active links.</p></div>
        <Link className="button-primary" href="/dashboard/shows/new">Create show</Link>
      </div>
      {error && <div className="error-box mt-6">{error}</div>}
      {loading || organizationLoading ? <p className="muted mt-8">Loading shows…</p> : !organization ? (
        <div className="info-box mt-8">Create an organization from the dashboard first.</div>
      ) : shows.length === 0 ? (
        <div className="card mt-8 p-8 text-center"><h2 className="text-lg font-semibold">No shows yet</h2><p className="muted mt-2 text-sm">Create the first show to start the review flow.</p><Link className="button-primary mt-5" href="/dashboard/shows/new">Create show</Link></div>
      ) : (
        <div className="mt-8 grid gap-4">
          {shows.map((show) => (
            <Link key={show.id} href={`/dashboard/shows/${show.id}`} className="card flex items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:border-[#9eb7a6]">
              <div><h2 className="font-semibold">{show.title}</h2><p className="muted mt-1 line-clamp-1 text-sm">{show.description || "No description"}</p></div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${show.status === "published" ? "bg-[#e9f5ee] text-[#0f5138]" : "bg-[#f0f1ee] text-[#68736c]"}`}>{show.status}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
