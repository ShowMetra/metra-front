"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard"); }, [router]);
  return <main className="shell py-20"><p className="muted">Opening ShowMetra…</p><Link className="button-primary mt-5" href="/dashboard">Open dashboard</Link></main>;
}
