import { ShowDetailPage } from "@/components/show-detail-page";

export default async function DynamicShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShowDetailPage id={id} />;
}
