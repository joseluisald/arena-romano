import React from 'react';
import { NavTab } from './Header';
import { Game } from '../types';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Package, 
  Clock, 
  TrendingUp,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeLiveGame: Game | null;
  onOpenLiveGame: (gameId: string) => void;
  onOpenNewGameModal: () => void;
  onOpenWhatsAppModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  activeLiveGame,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Início', icon: LayoutDashboard },
    { id: 'games' as NavTab, label: 'Jogos', icon: CalendarDays, badge: activeLiveGame ? 'AO VIVO' : undefined },
    { id: 'products' as NavTab, label: 'Bar', icon: Package },
    { id: 'schedules' as NavTab, label: 'Quadra', icon: Clock },
    { id: 'reports' as NavTab, label: 'Caixa', icon: TrendingUp },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C0E15]/95 backdrop-blur-xl border-t border-[#1B2132] pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative active-press cursor-pointer ${
                isActive 
                  ? 'text-[#FF6600]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Pip */}
              {isActive && (
                <span className="absolute -top-2 w-7 h-1 rounded-full bg-[#FF6600] shadow-[0_0_10px_#FF6600]" />
              )}

              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 h-2.5 w-2.5 rounded-full bg-orange-500 animate-ping" />
                )}
              </div>

              <span className={`text-[10px] mt-1.5 tracking-tight leading-none ${
                isActive ? 'font-black text-[#FF6600]' : 'font-medium text-slate-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
