"use client";

import { useCallback, useEffect, useState } from "react";
import type { Database } from "@/lib/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export function useCurrentOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError(authError?.message ?? "Authentication required.");
      setLoading(false);
      return;
    }
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", authData.user.id)
      .limit(1)
      .maybeSingle();
    if (membershipError) {
      setError(membershipError.message);
      setLoading(false);
      return;
    }
    if (!membership) {
      setOrganization(null);
      setLoading(false);
      return;
    }
    const { data, error: organizationError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .single();
    if (organizationError) setError(organizationError.message);
    setOrganization(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  return { organization, loading, error, reload };
}
