"use client";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "yellow" | "red" | "gray";
}

const variantStyles = {
  green: "bg-brand-600/20 text-brand-400 border border-brand-600/40",
  yellow: "bg-yellow-600/20 text-yellow-400 border border-yellow-600/40",
  red: "bg-red-600/20 text-red-400 border border-red-600/40",
  gray: "bg-surface-500 text-gray-400 border border-surface-400",
};

export function Badge({ children, variant = "gray" }: BadgeProps) {
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", variantStyles[variant])}>
      {children}
    </span>
  );
}
