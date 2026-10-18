import { Suspense } from "react";
import { connection } from "next/server";
import { PetitionsLoading } from "@/components/screens/petitions/loading";
import { ClientReady } from "@/components/shell/client-ready";
import { CourtScreen } from "@/components/screens/court/court-screen";
import { courtAddress } from "@/lib/arkiv/court/signer";
export default function Page() { return <Suspense fallback={<PetitionsLoading />}><CourtPage /></Suspense>; }
// The court address derives from a runtime secret, so this must not be captured at build time.
async function CourtPage() {
  await connection();
  const court = courtAddress();
  return <ClientReady fallback={<PetitionsLoading />}><CourtScreen court={court} /></ClientReady>;
}
