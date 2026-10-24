import type { Metadata } from "next";
import { SymbolDetail } from "@/components/symbols/SymbolViews";

export const metadata: Metadata = { title: "Symbol" };

export default async function SymbolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SymbolDetail id={decodeURIComponent(id)} />;
}
