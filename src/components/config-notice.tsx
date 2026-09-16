import { hasSupabaseConfig } from "@/lib/supabase";

export function ConfigNotice() {
  if (hasSupabaseConfig()) return null;
  return (
    <div className="info-box">
      Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to <code>.env.local</code> to connect ShowMetra.
    </div>
  );
}
