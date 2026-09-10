import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

export function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-[#fafaf8] p-3">
      <div className="text-black/35">{icon}</div>

      <div className="mt-2 text-lg font-black tracking-tight">{value}</div>

      <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-black/30">
        {label}
      </div>
    </div>
  );
}

export default StatCard;
