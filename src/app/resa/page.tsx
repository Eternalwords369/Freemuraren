import type { Metadata } from "next";
import { Suspense } from "react";
import { JourneyView } from "@/components/journey/JourneyView";

export const metadata: Metadata = { title: "Min resa" };

export default function JourneyPage() {
  return (
    <Suspense>
      <JourneyView />
    </Suspense>
  );
}
