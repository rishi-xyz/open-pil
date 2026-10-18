import type { Metadata } from "next";
import { LandingScreen } from "@/components/screens/landing/landing-screen";
export const metadata: Metadata = { title: "OpenPIL: public interest petitions on Arkiv", description: "Synthetic PIL petitions, review deadlines and court decisions recorded on Arkiv Tiramisu and readable by anyone." };
export default function Page() { return <LandingScreen />; }
