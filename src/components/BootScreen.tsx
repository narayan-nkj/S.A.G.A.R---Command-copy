import React, { useEffect, useState } from 'react';

const AshokaChakra = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <circle cx="50" cy="50" r="8" fill="currentColor" />
    {Array.from({ length: 24 }).map((_, i) => (
      <polygon 
        key={i} 
        points="49,50 51,50 50,10" 
        fill="currentColor" 
        transform={`rotate(${i * 15} 50 50)`} 
      />
    ))}
  </svg>
);

export const BootScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 500);
    const t2 = setTimeout(() => setStage(2), 1500);
    const t3 = setTimeout(() => {
      setStage(3);
      setTimeout(onComplete, 800); // fade out duration
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#020611] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out"
      style={{ opacity: stage === 3 ? 0 : 1, pointerEvents: stage === 3 ? 'none' : 'auto' }}
    >
      <div className="relative flex flex-col items-center">
        {/* Glowing Aura */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#E5B869] mix-blend-screen filter blur-[80px] transition-opacity duration-1000"
          style={{ opacity: stage >= 1 ? 0.15 : 0 }}
        />

        {/* Ashoka Chakra */}
        <div 
          className="relative w-32 h-32 text-[#E5B869] transition-all duration-1000 transform"
          style={{ 
            opacity: stage >= 1 ? 1 : 0, 
            transform: `scale(${stage >= 1 ? 1 : 0.8})` 
          }}
        >
          {/* We'll use a custom spin animation in tailwind if available, otherwise standard spin works, but let's just make it spin slowly inline */}
          <div className="w-full h-full animate-[spin_8s_linear_infinite]">
            <AshokaChakra className="w-full h-full" />
          </div>
        </div>

        {/* Text Details */}
        <div 
          className="mt-12 flex flex-col items-center transition-all duration-1000 transform"
          style={{ 
            opacity: stage >= 2 ? 1 : 0,
            transform: `translateY(${stage >= 2 ? 0 : 10}px)`
          }}
        >
          <h1 className="text-3xl font-bold tracking-[0.4em] text-[#F4EFE6] uppercase mb-2">
            S.A.G.A.R.
          </h1>
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#E5B869]/50 to-transparent mb-3" />
          <p className="text-[10px] font-mono tracking-[0.2em] text-[#45A796] uppercase">
            Seabed Anomaly Grid & Analysis Repository
          </p>
        </div>

        {/* Progress Bar */}
        <div 
          className="absolute -bottom-16 w-48 h-1 bg-white/10 rounded-full overflow-hidden transition-opacity duration-1000"
          style={{ opacity: stage >= 1 ? 1 : 0 }}
        >
          <div 
            className="h-full bg-gradient-to-r from-[#45A796] to-[#E5B869] transition-all ease-out"
            style={{ 
              width: stage >= 1 ? '100%' : '0%',
              transitionDuration: '2500ms'
            }}
          />
        </div>
      </div>
    </div>
  );
};
