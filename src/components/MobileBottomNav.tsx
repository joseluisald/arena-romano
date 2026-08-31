import React from 'react';
import { NavTab } from './Header';
import { Game } from '../types';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Package, 
  Clock, 
  TrendingUp,
  Plus
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
  onOpenLiveGame,
  onOpenNewGameModal,
  onOpenWhatsAppModal,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Início', icon: LayoutDashboard },
    { id: 'games' as NavTab, label: 'Jogos', icon: CalendarDays, badge: activeLiveGame ? 'AO VIVO' : undefined },
    { id: 'products' as NavTab, label: 'Bar', icon: Package },
    { id: 'schedules' as NavTab, label: 'Quadra', icon: Clock },
    { id: 'reports' as NavTab, label: 'Caixa', icon: TrendingUp },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c12]/95 backdrop-blur-xl border-t border-[#1e1e2a] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative active-press cursor-pointer ${
                isActive 
                  ? 'text-[#f27d26]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Bar on Top */}
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-[#f27d26] shadow-[0_0_8px_#f27d26]" />
              )}

              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>

              <span className={`text-[10px] mt-1 tracking-tight leading-none ${
                isActive ? 'font-black text-[#f27d26]' : 'font-medium text-slate-400'
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
