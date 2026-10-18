"use client";
import { useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { tiramisu } from "@/lib/arkiv/chain";
import { retryDelay } from "@/lib/arkiv/retry";
export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60000, retry: 3, retryDelay, refetchOnWindowFocus: false } } }));
  const content = <QueryClientProvider client={client}><TooltipProvider>{children}<Toaster /></TooltipProvider></QueryClientProvider>;
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) return content;
  return <PrivyProvider appId={appId} config={{ loginMethods: ["google", "telegram", "twitter", "discord"], defaultChain: tiramisu, supportedChains: [tiramisu], embeddedWallets: { ethereum: { createOnLogin: "all-users" } } }}>{content}</PrivyProvider>;
}
