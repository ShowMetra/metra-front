"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ReviewPage } from "@/components/review-page";

function StaticReviewView() {
  const token = useSearchParams().get("token");
  if (!token) return <main className="shell py-12"><div className="error-box">Review token is missing.</div></main>;
  return <ReviewPage token={token} />;
}

export default function StaticReviewPage() {
  return <Suspense fallback={<main className="shell py-12"><p className="muted">Opening review…</p></main>}><StaticReviewView /></Suspense>;
}
