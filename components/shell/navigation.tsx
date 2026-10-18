"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, FilePlus2 } from "lucide-react";
import { SlidingTabIndicator } from "@/components/motion/sliding-tab-indicator";
const tabs = [["/petitions", "Petitions", CalendarClock], ["/new", "New petition", FilePlus2]] as const;
export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const links = tabs.map(([href, label, Icon]) => <Link key={href} href={href} aria-current={(pathname === href || (href === "/petitions" && pathname.startsWith("/petitions/"))) ? "page" : undefined}>{mobile && <Icon aria-hidden="true" />}<span>{label}</span>{(pathname === href || (href === "/petitions" && pathname.startsWith("/petitions/"))) && <SlidingTabIndicator id={mobile ? "mobile-nav-underline" : "nav-underline"} />}</Link>);
  return <nav aria-label={mobile ? "Mobile navigation" : "Main navigation"} className={mobile ? "tabbar" : "topnav"}>{mobile ? <ul>{links.map((link, index) => <li key={tabs[index][0]}>{link}</li>)}</ul> : links}</nav>;
}
