import Link from "next/link";
import { CosmosMark } from "@/components/brand/CosmosMark";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <CosmosMark className="size-16 text-gold" />
      <p className="eyebrow mt-6">404</p>
      <h1 className="mt-3 text-4xl text-ink sm:text-5xl">Utanför kartan</h1>
      <p className="mt-3 max-w-[44ch] text-ink-2">Sidan finns inte. Den kan ha flyttats, eller så stavades adressen fel.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Till översikten
      </Link>
    </div>
  );
}
