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
  Shield, 
  X, 
  ChevronRight,
  LogOut,
  Activity,
  Terminal,
  Database
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
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'games',
      label: 'Jogos & Comandas',
      icon: <CalendarDays size={18} />,
    },
    {
      id: 'products',
      label: 'Cardápio & Bar',
      icon: <Package size={18} />,
    },
    {
      id: 'schedules',
      label: 'Horários da Quadra',
      icon: <Clock size={18} />,
    },
    {
      id: 'reports',
      label: 'Relatórios & Caixa',
      icon: <TrendingUp size={18} />,
    },
  ];

  const handleItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const content = (
    <div className="h-full flex flex-col justify-between bg-[#0b0b0f] text-slate-200 border-r border-[#1e1e27] select-none">
      {/* Top Section: Logo & Status */}
      <div>
        {/* Header Branding */}
        <div className="p-5 flex items-center justify-between border-b border-[#1b1b24]">
          <button 
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none hover:opacity-90 transition-opacity cursor-pointer"
          >
            <ArenaLogo size="sm" />
          </button>
          
          {/* Mobile close button */}
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#181822] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Game Alert Card if running */}
        {activeLiveGame && (
          <div className="p-3 mx-3 mt-3 rounded-xl bg-gradient-to-br from-[#1c1416] via-[#141016] to-[#0f0e15] border border-[#381c24] shadow-lg">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                <Flame size={14} className="animate-bounce" />
                <span>PARTIDA EM ANDAMENTO</span>
              </div>
              <span className="font-mono text-[11px] bg-black/60 px-1.5 py-0.5 rounded text-orange-300 border border-orange-500/20 font-bold">
                {activeLiveGame.start_time}
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate mb-2">{activeLiveGame.title}</p>
            <button
              onClick={() => {
                onOpenLiveGame(activeLiveGame.id);
                onCloseMobile();
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-[#f27d26] hover:bg-[#ff8a3d] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <span>Abrir Comandas</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="px-3 py-4 space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase px-3 mb-2 block">
            Navegação Principal
          </span>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-[#181824] text-white border border-[#2e2e3f] shadow-lg shadow-black/40 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#12121a] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-colors ${isActive ? 'text-[#f27d26]' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* System Logs & DB Audit Button */}
        <div className="px-3 pt-2">
          <button
            onClick={() => {
              if (onOpenSystemLogs) onOpenSystemLogs();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#13131d] hover:bg-[#191926] border border-[#232334] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Activity size={15} className="text-emerald-400 group-hover:animate-pulse" />
              <span>Auditoria & Banco</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded border border-[#252535]">
              Logs
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Section: User Session & Arena Identity Tag */}
      <div className="border-t border-[#1b1b24] bg-[#0c0c11]">
        {/* User Card if logged in */}
        {currentUser && (
          <div className="p-3 border-b border-[#181822] flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400 text-xs shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400/90 font-bold">
                  {currentUser.role}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                title="Sair do Sistema (Logout)"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}

        <div className="p-3 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-slate-300 text-[11px]">
            <Shield size={13} className="text-orange-400" /> Arena Romano
          </span>
          <span className="text-[10px] font-mono text-slate-400">v2.0 • MySQL</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Mobile Drawer Content */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {content}
      </div>
    </>
  );
};
