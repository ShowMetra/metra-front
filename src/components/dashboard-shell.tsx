"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/shows", label: "Shows" },
];

export function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#dfe5dd] bg-white/90 backdrop-blur">
        <div className="shell flex min-h-16 items-center justify-between gap-4">
          <Brand href="/dashboard" />
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);
              return <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-[#e9f5ee] text-[#0f5138]" : "text-[#68736c] hover:bg-[#f3f5f2]"}`}>{link.label}</Link>;
            })}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="max-w-48 truncate text-xs text-[#68736c]">{user.email}</span>
            <button className="button-ghost text-sm" type="button" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="shell py-8 sm:py-10">{children}</main>
    </div>
  );
}
