import type { Metadata } from "next";
import { Suspense } from "react";
import { KnowledgeMap } from "@/components/map/KnowledgeMap";

export const metadata: Metadata = { title: "Kunskapskarta" };

export default function MapPage() {
  return (
    <Suspense>
      <KnowledgeMap />
    </Suspense>
  );
}
