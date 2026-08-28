import React from 'react';

type BadgeType = 'normal' | 'unusual' | 'highly_anomalous' | 'unknown' | 'confirmed_unknown' | 'known_object' | 'pending' | 'false_positive';

interface StatusBadgeProps {
  status: BadgeType;
  label?: string;
}

const BADGE_CONFIG: Record<BadgeType, { color: string; dot: string; label: string }> = {
  normal:            { color: 'bg-[#45A796]/10 text-[#45A796] border-[#45A796]/25',  dot: 'bg-[#45A796]', label: 'Normal' },
  unusual:           { color: 'bg-[#E5B869]/10 text-[#E5B869] border-[#E5B869]/25',  dot: 'bg-[#E5B869]', label: 'Unusual' },
  highly_anomalous:  { color: 'bg-[#E05763]/10 text-[#E05763] border-[#E05763]/25',  dot: 'bg-[#E05763]', label: 'Highly Anomalous' },
  unknown:           { color: 'bg-[#B993FF]/10 text-[#B993FF] border-[#B993FF]/25',  dot: 'bg-[#B993FF]', label: 'Unknown' },
  confirmed_unknown: { color: 'bg-[#B993FF]/10 text-[#B993FF] border-[#B993FF]/25',  dot: 'bg-[#B993FF]', label: 'Confirmed Unknown' },
  known_object:      { color: 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/25',  dot: 'bg-[#60A5FA]', label: 'Known Object' },
  pending:           { color: 'bg-[#E5B869]/10 text-[#E5B869] border-[#E5B869]/25',  dot: 'bg-[#E5B869]', label: 'Pending Review' },
  false_positive:    { color: 'bg-[#8B9BB4]/10 text-[#8B9BB4] border-[#8B9BB4]/25',  dot: 'bg-[#8B9BB4]', label: 'False Positive' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = BADGE_CONFIG[status] || BADGE_CONFIG.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border tracking-wide ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {label || config.label}
    </span>
  );
}
