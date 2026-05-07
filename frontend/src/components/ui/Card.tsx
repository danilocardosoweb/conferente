"use client";
import clsx from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={clsx(
        "glass-panel rounded-2xl p-6 transition-all duration-300",
        glow && "shadow-emerald-glow border-brand-500/30",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}

export function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden group">
      {/* Indicador de acento lateral */}
      {accent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500" />}
      
      <div className="flex items-center gap-5">
        <div
          className={clsx(
            "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
            accent ? "bg-brand-500/10 text-brand-400" : "bg-surface-600/50 text-gray-400"
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1 font-bold">{label}</p>
          <p className={clsx("text-3xl font-black tracking-tight", accent ? "text-brand-400" : "text-white")}>
            {value}
          </p>
          {sub && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 opacity-70">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}
