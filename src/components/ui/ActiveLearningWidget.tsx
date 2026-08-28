import React from 'react';
import { Cpu, ArrowRight, Zap } from 'lucide-react';

interface ActiveLearningWidgetProps {
  currentModel: string;
  feedbackSamples: number;
  potentialRetrainingSet: number;
  nextModel: string;
}

export default function ActiveLearningWidget({
  currentModel,
  feedbackSamples,
  potentialRetrainingSet,
  nextModel,
}: ActiveLearningWidgetProps) {
  const pct = Math.min(100, Math.round((feedbackSamples / 50) * 100));

  return (
    <div className="
      bg-white/[0.02] backdrop-blur-3xl
      border border-white/10 border-t-white/[0.15]
      rounded-2xl p-6
      shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]
      relative overflow-hidden
    ">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#B993FF]/8 blur-3xl rounded-full translate-x-10 -translate-y-10 pointer-events-none" />

      <div className="flex items-center gap-2.5 mb-5 relative z-10">
        <div className="w-7 h-7 rounded-xl bg-[#B993FF]/10 border border-[#B993FF]/20 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-[#B993FF]" />
        </div>
        <h3 className="font-semibold text-[#F4EFE6] text-xs uppercase tracking-[0.12em]">Active Learning Pipeline</h3>
      </div>

      {/* Model progression */}
      <div className="flex items-center gap-3 mb-5 relative z-10">
        <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-center">
          <div className="text-[10px] text-[#8B9BB4] uppercase tracking-wider font-semibold mb-1">Current</div>
          <div className="text-sm font-mono font-bold text-[#F4EFE6]">{currentModel}</div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="w-4 h-4 text-[#8B9BB4]" />
          <div className="flex flex-col gap-0.5 text-center">
            <div className="text-[10px] font-mono text-[#45A796] font-bold">{feedbackSamples} fb</div>
            <div className="text-[10px] font-mono text-[#E5B869] font-bold">{potentialRetrainingSet} pend</div>
          </div>
        </div>

        <div className="flex-1 bg-[#B993FF]/[0.06] border border-[#B993FF]/20 rounded-xl px-3 py-2.5 text-center">
          <div className="text-[10px] text-[#8B9BB4] uppercase tracking-wider font-semibold mb-1">Next</div>
          <div className="text-sm font-mono font-bold text-[#B993FF]">{nextModel}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-[#8B9BB4]">
            <Zap className="w-3 h-3" /> Retraining readiness
          </div>
          <span className="text-[11px] font-mono font-bold text-[#B993FF]">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.05]">
          <div
            className="h-full bg-gradient-to-r from-[#B993FF]/60 to-[#B993FF] rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
