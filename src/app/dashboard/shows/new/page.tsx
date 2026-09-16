"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { ShowStatus } from "@/lib/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { errorMessage, slugify } from "@/lib/utils";
import { useCurrentOrganization } from "@/lib/use-current-organization";

export default function NewShowPage() {
  const router = useRouter();
  const { organization, loading, error: organizationError } = useCurrentOrganization();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ShowStatus>("published");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!slugEdited) setSlug(slugify(title)); }, [slugEdited, title]);

  const createShow = useCallback(async (values: { title: string; slug: string; description: string; status: ShowStatus }) => {
      if (!organization) throw new Error("Create or join an organization first.");
      if (values.slug.length < 2) throw new Error("Slug must contain at least two letters or numbers.");
      const { data, error: insertError } = await getSupabaseBrowserClient().from("shows").insert({
        organization_id: organization.id,
        title: values.title.trim(),
        slug: values.slug,
        description: values.description.trim() || null,
        status: values.status,
      }).select("id").single();
      if (insertError) throw insertError;
      router.push(`/dashboard/shows/${data.id}`);
      return data.id;
  }, [organization, router]);

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext?.registerTool || !organization) return;
    const lifecycle = new AbortController();
    void Promise.resolve(modelContext.registerTool({
      name: "create_show",
      title: "Create ShowMetra show",
      description: "Create a show in the current agency workspace and open its detail page.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", minLength: 2, maxLength: 100 },
          description: { type: "string", maxLength: 10000 },
          status: { type: "string", enum: ["draft", "published"] },
        },
        required: ["title", "slug", "status"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const value = input as Partial<{ title: string; slug: string; description: string; status: ShowStatus }>;
        if (!value.title || !value.slug || !value.status || !["draft", "published"].includes(value.status)) throw new Error("A valid title, slug, and status are required.");
        const showId = await createShow({ title: value.title, slug: value.slug, description: value.description ?? "", status: value.status });
        return { showId, status: "created" };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [createShow, organization]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!organization) return;
    setBusy(true);
    setError(null);
    try {
      await createShow({ title, slug, description, status });
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/shows" className="muted text-sm hover:text-[#176c4c]">← Back to shows</Link>
      <p className="eyebrow mt-7">New show</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create a show</h1>
      <p className="muted mt-2">Keep this simple; performances and review links come next.</p>
      {organizationError && <div className="error-box mt-6">{organizationError}</div>}
      {!loading && !organization && <div className="info-box mt-6">Create an organization from the dashboard before adding a show.</div>}
      <form onSubmit={submit} className="card mt-7 space-y-5 p-6 sm:p-7">
        <label className="block text-sm font-medium">Title<input className="field mt-1.5" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Midnight at the Marina" maxLength={200} required disabled={!organization} /></label>
        <label className="block text-sm font-medium">Slug<input className="field mt-1.5" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} placeholder="midnight-at-the-marina" minLength={2} maxLength={100} required disabled={!organization} /></label>
        <label className="block text-sm font-medium">Description <span className="muted font-normal">(optional)</span><textarea className="field mt-1.5 min-h-28 resize-y" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={10000} disabled={!organization} /></label>
        <label className="block text-sm font-medium">Status<select className="field mt-1.5" value={status} onChange={(event) => setStatus(event.target.value as ShowStatus)} disabled={!organization}><option value="published">Published — review links work</option><option value="draft">Draft — review links stay private</option></select></label>
        {error && <div className="error-box">{error}</div>}
        <button className="button-primary" disabled={busy || loading || !organization}>{busy ? "Creating…" : "Create show"}</button>
      </form>
    </div>
  );
}
