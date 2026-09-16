"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ShowDetailPage } from "@/components/show-detail-page";

function StaticShowView() {
  const id = useSearchParams().get("id");
  if (!id) return <div className="error-box">Show ID is missing.</div>;
  return <ShowDetailPage id={id} />;
}

export default function StaticShowPage() {
  return <Suspense fallback={<p className="muted">Loading show…</p>}><StaticShowView /></Suspense>;
}
