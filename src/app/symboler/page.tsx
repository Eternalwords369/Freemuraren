import type { Metadata } from "next";
import { SymbolLexicon } from "@/components/symbols/SymbolViews";

export const metadata: Metadata = { title: "Symbollexikon" };

export default function SymbolsPage() {
  return <SymbolLexicon />;
}
