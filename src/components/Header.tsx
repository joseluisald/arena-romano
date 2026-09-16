import React from 'react';
import { ArenaLogo } from './ArenaLogo';
import { Game, User } from '../types';
import { 
  Menu,
  Plus, 
  MessageSquareShare,
  Flame,
  LogOut,
  Sparkles
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
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  activeLiveGame,
  onOpenLiveGame,
  onOpenNewGameModal,
  onOpenWhatsAppModal,
  onToggleSidebarMobile,
  currentUser,
  onLogout,
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Visão Geral Operacional';
      case 'games': return 'Controle de Jogos & Comandas';
      case 'products': return 'Cardápio & Preços Progressivos';
      case 'schedules': return 'Agenda & Horários da Quadra';
      case 'reports': return 'Relatórios Financeiros & Fechamento';
      default: return 'Arena Romano';
    }
  };

  const getTabCategory = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Centro Esportivo';
      case 'games': return 'Operação Ao Vivo';
      case 'products': return 'Bar & Lanchonete';
      case 'schedules': return 'Quadra de Futebol';
      case 'reports': return 'Gestão de Caixa';
      default: return 'Arena Romano';
    }
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-[#0C0E15]/90 backdrop-blur-md text-white border-b border-[#1B2132] shadow-sm">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Mobile trigger & Page context */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebarMobile}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-[#121622] hover:bg-[#181E2E] border border-[#1E2538] transition-colors cursor-pointer"
            aria-label="Abrir Menu de Navegação"
          >
            <Menu size={20} />
          </button>

          <div className="md:hidden">
            <ArenaLogo size="sm" showSubtitle={false} />
          </div>

          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {getTabCategory(activeTab)}
              </span>
              <span className="text-slate-600 text-xs">/</span>
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FF6600]"></span>
                {getTabTitle(activeTab)}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Live match banner indicator (Desktop) */}
        {activeLiveGame && (
          <button
            onClick={() => onOpenLiveGame(activeLiveGame.id)}
            className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 via-[#FF6600]/20 to-orange-500/15 border border-orange-500/35 text-orange-200 hover:border-orange-500/60 transition-all text-xs font-semibold cursor-pointer shadow-sm group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6600]"></span>
            </span>
            <span className="text-white font-extrabold text-[11px] tracking-wide">AO VIVO:</span>
            <span className="truncate max-w-[150px] text-orange-300 font-bold">{activeLiveGame.title}</span>
            <span className="bg-[#FF6600] text-white font-black px-1.5 py-0.5 rounded text-[10px]">
              {activeLiveGame.start_time}
            </span>
          </button>
        )}

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          {/* WhatsApp Import */}
          <button
            onClick={onOpenWhatsAppModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 text-xs font-bold transition-all active-press cursor-pointer shadow-xs"
            title="Importar lista copiada do WhatsApp"
          >
            <MessageSquareShare size={15} />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* New Game */}
          <button
            onClick={onOpenNewGameModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6600] hover:bg-[#FF7B1A] text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all active-press cursor-pointer"
          >
            <Plus size={16} />
            <span>Novo Jogo</span>
          </button>

          {/* User Profile & Quick Logout on Desktop */}
          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#121622] hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 border border-[#1E2538] hover:border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
              title={`Conectado como ${currentUser.name || currentUser.username}. Clique para sair.`}
            >
              <LogOut size={14} className="text-slate-400" />
              <span className="truncate max-w-[90px]">{currentUser.username}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Live Match ticker bar */}
      {activeLiveGame && (
        <div 
          onClick={() => onOpenLiveGame(activeLiveGame.id)}
          className="lg:hidden bg-gradient-to-r from-[#211215] via-[#2D161B] to-[#211215] border-t border-orange-500/30 px-3.5 py-2 flex items-center justify-between text-xs text-white cursor-pointer active-press"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6600]"></span>
            </span>
            <span className="font-extrabold text-[#FF6600] text-[11px]">AO VIVO:</span>
            <span className="truncate font-semibold text-slate-200">{activeLiveGame.title}</span>
          </div>
          <span className="bg-[#FF6600] text-white font-black px-2 py-0.5 rounded text-[10px] shrink-0 ml-2">
            Comandas →
          </span>
        </div>
      )}
    </header>
  );
};
