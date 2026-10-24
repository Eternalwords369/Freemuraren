import type { Metadata } from "next";
import { ArchiveDetail } from "@/components/archive/ArchiveDetail";

export const metadata: Metadata = { title: "Post i arkivet" };

export default async function ArchiveItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArchiveDetail id={decodeURIComponent(id)} />;
}
