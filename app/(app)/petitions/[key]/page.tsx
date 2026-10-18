import { PetitionLoading } from "@/components/screens/petition/loading";
import { Suspense } from "react";
import { PetitionScreen } from "@/components/screens/petition/petition-screen";
type Props = { params: Promise<{ key: string }> };
export default function Page({ params }: Props) {
  return <Suspense fallback={<PetitionLoading />}><PetitionPage params={params} /></Suspense>;
}
async function PetitionPage({ params }: Props) {
  const { key } = await params;
  return <PetitionScreen entityKey={key} />;
}
