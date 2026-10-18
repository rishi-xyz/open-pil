"use client";
import { motion, useReducedMotion } from "motion/react";
export function SlidingTabIndicator({ id = "tab-underline" }: { id?: string }) {
  const reduced = useReducedMotion();
  return <motion.span aria-hidden="true" className="sliding-indicator" layoutId={id} transition={{ duration: reduced ? 0 : .32, ease: [.22, 1, .36, 1] }} />;
}
