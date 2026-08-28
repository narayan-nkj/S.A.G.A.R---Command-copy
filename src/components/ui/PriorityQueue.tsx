import React from 'react';
import { Anomaly } from '../../data/mockData';
import StatusBadge from './StatusBadge';
import { Target, ChevronRight } from 'lucide-react';

interface PriorityQueueProps {
  anomalies: Anomaly[];
  onSelectAnomaly?: (id: string) => void;
  selectedId?: string;
}

export default function PriorityQueue({ anomalies, onSelectAnomaly, selectedId }: PriorityQueueProps) {
  return (
    <div className="
      bg-white/[0.02] backdrop-blur-3xl
      border border-white/10 border-t-white/[0.15]
      rounded-2xl overflow-hidden flex flex-col h-full
      shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]
    ">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="font-semibold text-[#F4EFE6] flex items-center gap-2.5 text-xs uppercase tracking-[0.12em]">
          <div className="w-6 h-6 rounded-lg bg-[#E05763]/10 border border-[#E05763]/20 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-[#E05763]" />
          </div>
          Priority Queue
        </h3>
        <span className="text-[10px] font-mono font-semibold bg-white/[0.04] border border-white/10 text-[#8B9BB4] px-2.5 py-1 rounded-full">
          {anomalies.length} items
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {anomalies.length === 0 ? (
          <div className="p-8 text-center text-[#8B9BB4] text-sm">No priority items found.</div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {anomalies.map(anomaly => (
              <li key={anomaly.id}>
                <button
                  onClick={() => onSelectAnomaly?.(anomaly.id)}
                  className={`w-full text-left px-5 py-4 hover:bg-white/[0.04] transition-all duration-200 ease-out flex items-center justify-between group border-l-2 ${
                    selectedId === anomaly.id
                      ? 'bg-white/[0.04] border-[#E05763]'
                      : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-[#F4EFE6] text-sm">{anomaly.label}</span>
                      <StatusBadge status={anomaly.severity === 'high' ? 'highly_anomalous' : anomaly.severity === 'unusual' ? 'unusual' : 'normal'} />
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-mono text-[#8B9BB4]">
                      <span>Conf: <span className="text-[#F4EFE6]">{anomaly.confidence}%</span></span>
                      <span>Score: <span className="text-[#F4EFE6]">{anomaly.overallScore}</span>/100</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                    selectedId === anomaly.id ? 'text-[#E05763]' : 'text-[#8B9BB4] group-hover:text-[#F4EFE6] group-hover:translate-x-0.5'
                  }`} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
