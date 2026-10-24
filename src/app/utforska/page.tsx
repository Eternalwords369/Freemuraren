import type { Metadata } from "next";
import { ExploreIndex } from "@/components/explore/ExploreViews";

export const metadata: Metadata = { title: "Utforska" };

export default function ExplorePage() {
  return <ExploreIndex />;
}
