import React from 'react';
import { Shield, Flame } from 'lucide-react';

interface ArenaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const ArenaLogo: React.FC<ArenaLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSize = size === 'sm' ? 22 : size === 'lg' ? 40 : 30;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Emblem with imperial wine background and ember flame */}
      <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8E1632] via-[#6B0E23] to-[#2B050D] text-white p-2.5 shadow-lg shadow-black/50 border border-[#A81F3D]/40 ring-1 ring-white/10">
        <Shield size={iconSize} className="text-white/90 fill-[#4A0817]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Flame size={iconSize * 0.58} className="text-orange-400 fill-[#FF6600] animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6600] text-[9px] font-black text-white shadow-md border border-[#10131B]">
          1
        </div>
      </div>

      {/* Typography */}
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-black tracking-wider text-white text-base sm:text-lg uppercase font-sans">
            Arena <span className="text-[#FF6600]">Romano</span>
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
            Centro Esportivo
          </p>
        )}
      </div>
    </div>
  );
};
