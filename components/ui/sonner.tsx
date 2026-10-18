"use client";
import { useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleCheck, Info, TriangleAlert, OctagonX, Loader2 } from "lucide-react";
const Toaster = (props: ToasterProps) => {
  const [mobile, setMobile] = useState(false);
  useEffect(() => { const media = window.matchMedia("(max-width: 639px)"); const update = () => setMobile(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  return <Sonner {...props} theme="light" position={mobile ? "top-center" : "bottom-right"} offset={24} mobileOffset={16} gap={8} visibleToasts={3} closeButton={false} icons={{ success: <CircleCheck className="size-4 text-[var(--ok)]" />, info: <Info className="size-4 text-primary" />, warning: <TriangleAlert className="size-4 text-[var(--warn)]" />, error: <OctagonX className="size-4 text-destructive" />, loading: <Loader2 className="size-4 animate-spin text-muted-foreground" /> }} toastOptions={{ unstyled: true, classNames: { toast: "flex items-start bg-[var(--surface-1)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-lg)] p-4 gap-3 font-sans w-[360px] max-w-full", title: "text-sm leading-5 font-medium text-foreground", description: "text-[13px] leading-5 text-[var(--text-2)] line-clamp-3", actionButton: "border border-[var(--border-strong)] rounded-md h-9 px-3 text-[13px] bg-card text-foreground", closeButton: "hidden" } }} />;
};
export { Toaster };
