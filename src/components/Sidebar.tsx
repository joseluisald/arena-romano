import React from 'react';
import { ArenaLogo } from './ArenaLogo';
import { NavTab } from './Header';
import { Game, User } from '../types';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Package, 
  Clock, 
  TrendingUp, 
  Flame, 
  X, 
  ChevronRight,
  LogOut,
  Terminal,
  Activity,
  Circle
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeLiveGame: Game | null;
  onOpenLiveGame: (gameId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenSystemLogs?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeLiveGame,
  onOpenLiveGame,
  isOpenMobile,
  onCloseMobile,
  currentUser,
  onLogout,
  onOpenSystemLogs,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: <LayoutDashboard size={19} />,
    },
    {
      id: 'games',
      label: 'Jogos & Comandas',
      icon: <CalendarDays size={19} />,
      badge: activeLiveGame ? 'AO VIVO' : undefined,
    },
    {
      id: 'products',
      label: 'Cardápio & Bar',
      icon: <Package size={19} />,
    },
    {
      id: 'schedules',
      label: 'Horários da Quadra',
      icon: <Clock size={19} />,
    },
    {
      id: 'reports',
      label: 'Relatórios & Caixa',
      icon: <TrendingUp size={19} />,
    },
  ];

  const handleItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#0C0E15] text-slate-200 border-r border-[#1B2132] select-none">
      {/* Top Header & Navigation */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1B2132] flex items-center justify-between bg-gradient-to-b from-[#121622] to-transparent">
          <button 
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none hover:opacity-90 transition-opacity cursor-pointer"
          >
            <ArenaLogo size="sm" />
          </button>
          
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#181D2C] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Match Spotlight Card */}
        {activeLiveGame && (
          <div className="p-3.5 mx-3 mt-3.5 rounded-2xl bg-gradient-to-br from-[#231215] via-[#1A1016] to-[#121019] border border-orange-500/30 shadow-lg shadow-black/40 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 text-orange-400 font-extrabold text-[11px] tracking-wide">
                <Flame size={14} className="text-orange-400 animate-bounce" />
                <span>AO VIVO AGORA</span>
              </div>
              <span className="font-mono text-[11px] bg-black/70 px-2 py-0.5 rounded-md text-orange-300 border border-orange-500/30 font-bold">
                {activeLiveGame.start_time}
              </span>
            </div>

            <p className="text-xs font-bold text-white truncate mb-2.5">{activeLiveGame.title}</p>
            
            <button
              onClick={() => {
                onOpenLiveGame(activeLiveGame.id);
                onCloseMobile();
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#FF6600] hover:bg-[#FF7A1A] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer active-press"
            >
              <span>Gerenciar Comandas</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Navigation List */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3.5 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Menu Principal
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <Circle size={6} className="fill-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-[#181E2E] text-white border border-[#2B354F] shadow-md shadow-black/40 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#121622] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-colors ${
                    isActive ? 'text-[#FF6600]' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom User & System Footer */}
      <div className="p-3 border-t border-[#1B2132] bg-[#0A0C12] space-y-2">
        {currentUser && (
          <div className="p-2.5 rounded-xl bg-[#121622] border border-[#1E2538] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#FF6600]/15 border border-[#FF6600]/30 text-[#FF6600] flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {currentUser.name || currentUser.username}
                </p>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                  {currentUser.role === 'admin' ? 'Administrador' : 'Operador'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onOpenSystemLogs && (
                <button
                  onClick={onOpenSystemLogs}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A2030] transition-colors cursor-pointer"
                  title="Auditoria e Logs de Sistema"
                >
                  <Terminal size={14} />
                </button>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Sair do sistema"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="px-2 flex items-center justify-between text-[10px] text-slate-400">
          <span>Arena Romano v5.0</span>
          <span>Pronto</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Fixed */}
      <aside className="hidden md:flex md:w-64 md:flex-col shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85%] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
