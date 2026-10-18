"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { publicClient } from "@/lib/arkiv/clients";
import { balanceKey, balanceState, gasKey } from "@/lib/arkiv/balance";
export function useWalletBalance(address?: Address) {
  const query = useQuery({
    queryKey: balanceKey(address), enabled: !!address, staleTime: 60000,
    refetchInterval: 60000, refetchIntervalInBackground: false, refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!address) throw new Error("No connected wallet");
      return (await publicClient.getBalance({ address })).toString();
    },
  });
  const gas = useQuery({ queryKey: gasKey(address), queryFn: () => "0", enabled: false, initialData: "0", staleTime: Infinity });
  const { refetch } = query;
  useEffect(() => {
    const visible = () => { if (address && document.visibilityState === "visible") void refetch(); };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [address, refetch]);
  return { ...query, ...balanceState(address ? query.data : undefined, gas.data) };
}
