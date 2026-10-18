import type { ReactNode } from "react";
import { Info, TriangleAlert, CircleAlert, CircleCheck } from "lucide-react";
export function Notice({ tone = "info", title, children, action, icon }: { tone?: "info" | "warn" | "error" | "success"; title: string; children?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  const Icon = { info: Info, warn: TriangleAlert, error: CircleAlert, success: CircleCheck }[tone];
  return <div className="notice" data-tone={tone} role={tone === "error" ? "alert" : "status"}><span className="notice-icon">{icon ?? <Icon size={20} aria-hidden="true" />}</span><div><strong>{title}</strong>{children && <div className="t-small">{children}</div>}</div>{action && <div className="notice-action">{action}</div>}</div>;
}
