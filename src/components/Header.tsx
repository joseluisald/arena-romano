import React from 'react';
import { ArenaLogo } from './ArenaLogo';
import { Game } from '../types';
import { 
  Menu,
  Plus, 
  MessageSquareShare,
  Flame,
  LayoutDashboard,
  CalendarDays,
  Package,
  Clock,
  TrendingUp
} from 'lucide-react';

export type NavTab = 'dashboard' | 'games' | 'products' | 'schedules' | 'reports';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeLiveGame: Game | null;
  onOpenLiveGame: (gameId: string) => void;
  onOpenNewGameModal: () => void;
  onOpenWhatsAppModal: () => void;
  onToggleSidebarMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  activeLiveGame,
  onOpenLiveGame,
  onOpenNewGameModal,
  onOpenWhatsAppModal,
  onToggleSidebarMobile,
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Visão Geral do Centro Esportivo';
      case 'games': return 'Controle de Jogos & Comandas';
      case 'products': return 'Cardápio & Preços Progressivos';
      case 'schedules': return 'Gestão de Horários da Quadra';
      case 'reports': return 'Relatórios Financeiros & Caixa';
      default: return 'Arena Romano';
    }
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-[#0d0d12]/95 backdrop-blur-md text-white border-b border-[#1e1e27] shadow-lg shadow-black/40">
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Mobile Hamburger & Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleSidebarMobile}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#181824] border border-[#272736] transition-colors cursor-pointer"
            aria-label="Abrir Menu"
          >
            <Menu size={20} />
          </button>

          <div className="md:hidden">
            <ArenaLogo size="sm" />
          </div>

          <div className="hidden md:block">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#f27d26]"></span>
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Live Game Center Indicator */}
        {activeLiveGame && (
          <button
            onClick={() => onOpenLiveGame(activeLiveGame.id)}
            className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-500/10 border border-orange-500/30 text-orange-200 hover:border-orange-500/50 transition-all text-xs font-semibold cursor-pointer shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400"></span>
            </span>
            <span className="text-white font-bold">EM ANDAMENTO:</span>
            <span className="truncate max-w-[160px] text-orange-300 font-medium">{activeLiveGame.title}</span>
            <span className="bg-[#f27d26] text-white font-black px-1.5 py-0.2 rounded text-[10px] shadow-xs">
              {activeLiveGame.start_time}
            </span>
          </button>
        )}

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWhatsAppModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 text-xs sm:text-sm font-bold shadow-sm transition-all active-press cursor-pointer"
            title="Importar lista copiada do WhatsApp"
          >
            <MessageSquareShare size={15} />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={onOpenNewGameModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all active-press cursor-pointer"
          >
            <Plus size={15} />
            <span>Novo Jogo</span>
          </button>
        </div>
      </div>

      {/* Mobile Live Game Bar */}
      {activeLiveGame && (
        <div 
          onClick={() => onOpenLiveGame(activeLiveGame.id)}
          className="lg:hidden bg-gradient-to-r from-[#1c1417] via-[#2a171a] to-[#1c1417] border-t border-[#3a1d24] px-3 py-1.5 flex items-center justify-between text-xs text-white cursor-pointer"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Flame size={13} className="text-orange-400 animate-bounce shrink-0" />
            <span className="font-bold text-orange-400">JOGO EM ANDAMENTO:</span>
            <span className="truncate text-slate-200">{activeLiveGame.title}</span>
          </div>
          <span className="bg-[#f27d26] text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm shrink-0 ml-2">
            Ver Comandas ➜
          </span>
        </div>
      )}

      {/* Mobile Bottom-bar navigation tabs for quick thumbs */}
      <div className="md:hidden flex items-center justify-around bg-[#09090d] border-t border-[#1a1a24] py-1 text-[10px] text-slate-400 font-medium">
        {[
          { id: 'dashboard' as NavTab, label: 'Início', icon: <LayoutDashboard size={16} /> },
          { id: 'games' as NavTab, label: 'Jogos', icon: <CalendarDays size={16} /> },
          { id: 'products' as NavTab, label: 'Bar', icon: <Package size={16} /> },
          { id: 'schedules' as NavTab, label: 'Quadra', icon: <Clock size={16} /> },
          { id: 'reports' as NavTab, label: 'Caixa', icon: <TrendingUp size={16} /> },
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-[#f27d26] font-bold' : 'hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
