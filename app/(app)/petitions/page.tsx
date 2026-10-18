import { PetitionsLoading } from "@/components/screens/petitions/loading";
import { ClientReady } from "@/components/shell/client-ready";
import { PetitionsScreen } from "@/components/screens/petitions/petitions-screen";
export default function Page() { return <ClientReady fallback={<PetitionsLoading />}><PetitionsScreen /></ClientReady>; }
