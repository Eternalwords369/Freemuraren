import type { Metadata } from "next";
import { Suspense } from "react";
import { ArchiveView } from "@/components/archive/ArchiveView";

export const metadata: Metadata = { title: "Kunskapsarkiv" };

export default function ArchivePage() {
  return (
    <Suspense>
      <ArchiveView />
    </Suspense>
  );
}
