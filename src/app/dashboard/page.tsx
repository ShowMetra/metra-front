"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { errorMessage, slugify } from "@/lib/utils";
import { useCurrentOrganization } from "@/lib/use-current-organization";

export default function DashboardPage() {
  const { organization, loading, error, reload } = useCurrentOrganization();
  const [showCount, setShowCount] = useState(0);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    void getSupabaseBrowserClient().from("shows").select("id", { count: "exact", head: true }).eq("organization_id", organization.id)
      .then(({ count }) => setShowCount(count ?? 0));
  }, [organization]);

  async function createOrganization(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const slug = slugify(name);
      if (slug.length < 2) throw new Error("Use at least two letters or numbers in the organization name.");
      const { error: rpcError } = await getSupabaseBrowserClient().rpc("create_organization", { p_name: name.trim(), p_slug: slug });
      if (rpcError) throw rpcError;
      await reload();
    } catch (caught) {
      setFormError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="muted">Loading workspace…</p>;
  if (error) return <div className="error-box">{error}</div>;
  if (!organization) {
    return (
      <div className="max-w-xl">
        <p className="eyebrow">First setup</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create your agency workspace</h1>
        <p className="muted mt-3 leading-7">Your shows, performances, and review links will live inside this organization.</p>
        <form onSubmit={createOrganization} className="card mt-7 space-y-4 p-6">
          <label className="block text-sm font-medium">Agency name<input className="field mt-1.5" value={name} onChange={(event) => setName(event.target.value)} placeholder="Sunset Entertainment" required /></label>
          {formError && <div className="error-box">{formError}</div>}
          <button className="button-primary" disabled={busy}>{busy ? "Creating…" : "Create workspace"}</button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Agency workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{organization.name}</h1><p className="muted mt-2">Manage the first guest feedback loop end to end.</p></div>
        <Link href="/dashboard/shows/new" className="button-primary">Create show</Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="muted text-sm">Shows</p><p className="mt-3 text-3xl font-semibold">{showCount}</p></div>
        <div className="card p-5 sm:col-span-2"><p className="text-sm font-semibold">MVP flow</p><p className="muted mt-2 text-sm leading-6">Create a show, add a performance, generate its guest review link, then share it with the audience.</p></div>
      </div>
    </>
  );
}
