import { PetitionLoading } from "@/components/screens/petition/loading";
import { ClientReady } from "@/components/shell/client-ready";
import { NewScreen } from "@/components/screens/new/new-screen";
export default function Page() { return <ClientReady fallback={<PetitionLoading />}><NewScreen /></ClientReady>; }
