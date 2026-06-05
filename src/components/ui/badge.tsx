"use client";
import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-slate-700 text-slate-200",
        variant === "success" && "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40",
        variant === "warning" && "bg-yellow-900/60 text-yellow-300 border border-yellow-700/40",
        variant === "danger" && "bg-red-900/60 text-red-300 border border-red-700/40",
        variant === "info" && "bg-cyan-900/60 text-cyan-300 border border-cyan-700/40",
        className
      )}
    >
      {children}
    </span>
  );
}
