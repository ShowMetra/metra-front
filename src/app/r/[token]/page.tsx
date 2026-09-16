import { ReviewPage } from "@/components/review-page";

export default async function DynamicReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ReviewPage token={token} />;
}
