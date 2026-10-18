import { addressUrl, tiramisu } from "@/lib/arkiv/chain";
import { Suspense } from "react";
import Link from "next/link";
import { LoginButton } from "@/components/shell/login-button";
import { ChainStatus } from "@/components/shell/chain-status";
import { Navigation } from "@/components/shell/navigation";
import { LogoMark } from "@/components/brand/logo-mark";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const registry = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  return <><header className="topbar"><div className="wrap"><Link href="/" className="wordmark"><LogoMark /><b>OpenPIL</b></Link><Suspense fallback={null}><Navigation /></Suspense><ChainStatus /><div className="account"><LoginButton /></div></div></header><main className="wrap page w-full">{children}</main><footer className="wrap app-footer t-small w-full"><div><span>OpenPIL. Synthetic petitions on Arkiv Tiramisu testnet.</span><nav aria-label="Registry and explorer">{registry && <a href={addressUrl(registry)} target="_blank" rel="noopener noreferrer">Registry wallet <span className="mono">{registry.slice(0, 6)}…{registry.slice(-4)}</span></a>}<a href={tiramisu.blockExplorers.default.url} target="_blank" rel="noopener noreferrer">Arkiv Explorer</a></nav></div></footer><Suspense fallback={null}><Navigation mobile /></Suspense></>;
}
