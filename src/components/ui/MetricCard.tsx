import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  colorClass?: string;
  trend?: string;
}

export default function MetricCard({ label, value, icon: Icon, colorClass = 'text-[#45A796]', trend }: MetricCardProps) {
  return (
    <div className="
      bg-white/[0.02] backdrop-blur-3xl
      border border-white/10 border-t-white/[0.15] border-l-white/[0.15]
      rounded-2xl p-6
      shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]
      hover:bg-white/[0.05] transition-all duration-300 ease-out
      flex flex-col justify-between
      group
    ">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#8B9BB4] text-xs font-semibold uppercase tracking-[0.1em]">{label}</span>
        {Icon && <Icon className={`w-5 h-5 ${colorClass}`} />}
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold text-[#F4EFE6] tracking-tight">{value}</span>
        {trend && <span className="text-xs font-mono text-[#8B9BB4] leading-none">{trend}</span>}
      </div>
    </div>
  );
}
