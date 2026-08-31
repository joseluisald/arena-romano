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
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 42 : 32;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Visual Emblem */}
      <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8B1832] via-[#5C0D1E] to-[#1e060b] text-white p-2 shadow-lg shadow-black/40 border border-[#591523]">
        <Shield size={iconSize} className="text-white fill-[#5C0D1E]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Flame size={iconSize * 0.55} className="text-orange-400 fill-[#f27d26] animate-pulse-subtle" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f27d26] text-[9px] font-black text-white shadow-xs">
          1
        </div>
      </div>

      {/* Brand Typography */}
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-extrabold tracking-wider text-white text-lg sm:text-xl font-sans uppercase">
            Arena <span className="text-[#f27d26]">Romano</span>
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] font-medium tracking-wide text-rose-200/80 mt-0.5">
            Centro Esportivo
          </p>
        )}
      </div>
    </div>
  );
};
