import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { GameDetailsView } from './components/GameDetailsView';
import { ProductsView } from './components/ProductsView';
import { SchedulesView } from './components/SchedulesView';
import { ReportsView } from './components/ReportsView';
import { WhatsAppImportModal } from './components/WhatsAppImportModal';
import { GameFormModal } from './components/GameFormModal';
import { LoginView } from './components/LoginView';
import { SystemLogsModal } from './components/SystemLogsModal';
import { store } from './services/store';
import { authService } from './services/auth';
import { AuthState } from './types';
import { formatCurrency } from './utils/pricing';
import { 
  CalendarDays, 
  Clock, 
  Users, 
  ArrowRight, 
  Search,
  Flame
} from 'lucide-react';

export default function App() {
  // Auth state subscription
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    const unsubscribeAuth = authService.subscribe((state) => {
      setAuthState(state);
    });
    return unsubscribeAuth;
  }, []);

  // Store subscription trigger
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Global Modals
  const [isWhatsAppImportOpen, setIsWhatsAppImportOpen] = useState(false);
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [isSystemLogsOpen, setIsSystemLogsOpen] = useState(false);

  // Games Tab Filter State
  const [gamesSearch, setGamesSearch] = useState('');
  const [gamesStatusFilter, setGamesStatusFilter] = useState<'todos' | 'agendado' | 'em_andamento' | 'finalizado'>('todos');

  // If user is not authenticated, display Login Area!
  if (!authState.isAuthenticated) {
    return <LoginView onLoginSuccess={() => setAuthState(authService.getState())} />;
  }

  const allGames = store.getGames();
  const activeLiveGame = allGames.find(g => g.status === 'em_andamento') || null;

  const handleOpenGame = (gameId: string) => {
    setSelectedGameId(gameId);
  };

  const handleBackToGames = () => {
    setSelectedGameId(null);
  };

  const handleSelectTab = (tab: NavTab) => {
    setSelectedGameId(null);
    setActiveTab(tab);
  };

  const filteredGamesList = allGames.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(gamesSearch.toLowerCase()) || g.date.includes(gamesSearch);
    if (!matchesSearch) return false;
    if (gamesStatusFilter !== 'todos') return g.status === gamesStatusFilter;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 font-sans flex flex-col md:flex-row selection:bg-[#FF6600] selection:text-white antialiased">
      {/* Immersive UI Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        activeLiveGame={activeLiveGame}
        onOpenLiveGame={handleOpenGame}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        currentUser={authState.user}
        onLogout={() => authService.logout()}
        onOpenSystemLogs={() => setIsSystemLogsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          activeLiveGame={activeLiveGame}
          onOpenLiveGame={handleOpenGame}
          onOpenNewGameModal={() => setIsNewGameModalOpen(true)}
          onOpenWhatsAppModal={() => setIsWhatsAppImportOpen(true)}
          onToggleSidebarMobile={() => setIsSidebarOpenMobile(true)}
          currentUser={authState.user}
          onLogout={() => authService.logout()}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto">
          {selectedGameId ? (
            <GameDetailsView
              gameId={selectedGameId}
              onBack={handleBackToGames}
            />
          ) : activeTab === 'dashboard' ? (
            <DashboardView
              onOpenGame={handleOpenGame}
            />
          ) : activeTab === 'games' ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 md:pb-12 text-slate-100">
              
              {/* Header card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-md shadow-black/20">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Jogos & Histórico de Comandas
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Gerencie comandas ativas de jogadores, status de pagamento e ocupação da quadra.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 bg-[#181D2B] px-3 py-1.5 rounded-xl border border-[#23293D]">
                    Total: {allGames.length} jogos
                  </span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por título do jogo, data (AAAA-MM-DD)..."
                    value={gamesSearch}
                    onChange={e => setGamesSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#1E2436] bg-[#10131B] text-white placeholder:text-slate-400 focus:border-[#FF6600] outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'em_andamento', label: 'Ao Vivo' },
                    { id: 'agendado', label: 'Agendados' },
                    { id: 'finalizado', label: 'Finalizados' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setGamesStatusFilter(s.id as any)}
                      className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                        gamesStatusFilter === s.id
                          ? 'bg-[#FF6600] text-white shadow-md shadow-orange-500/20'
                          : 'bg-[#10131B] text-slate-400 hover:text-slate-200 border border-[#1E2436] hover:bg-[#151A26]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredGamesList.map(game => {
                  const consumption = game.players.reduce((sum, p) => sum + p.total_consumption, 0);
                  const presentCount = game.players.filter(p => p.is_present).length;
                  const isLive = game.status === 'em_andamento';
                  const isFinished = game.status === 'finalizado';

                  return (
                    <div
                      key={game.id}
                      onClick={() => handleOpenGame(game.id)}
                      className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer flex flex-col justify-between group ${
                        isLive
                          ? 'bg-[#15141D] border-orange-500/40 hover:border-orange-500/70 shadow-md shadow-orange-500/10'
                          : 'bg-[#10131B] border-[#1E2436] hover:border-[#2B354F] hover:bg-[#131722]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 font-mono font-bold text-xs bg-[#181D2B] px-2.5 py-1 rounded-lg border border-[#23293D] text-slate-200">
                              <Clock size={12} className="text-[#FF6600]" />
                              {game.start_time} - {game.end_time}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {game.date.split('-').reverse().join('/')}
                            </span>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isLive
                              ? 'bg-[#FF6600]/15 text-[#FF6600] border-[#FF6600]/30 animate-pulse'
                              : isFinished
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {isLive ? 'Ao Vivo' : isFinished ? 'Finalizado' : 'Agendado'}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-white group-hover:text-[#FF6600] transition-colors line-clamp-1 mb-3">
                          {game.title}
                        </h3>

                        <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-[#1B2132] my-2.5">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Jogadores</span>
                            <span className="font-bold text-white font-mono">{presentCount} / {game.players.length} presentes</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consumo Bar</span>
                            <span className="font-bold text-[#FF6600] font-mono">{formatCurrency(consumption)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Quadra: <strong className="text-slate-200 font-mono">{formatCurrency(game.court_price)}</strong>
                        </span>

                        <span className="px-3 py-1.5 rounded-xl bg-[#181D2B] group-hover:bg-[#FF6600] text-slate-200 group-hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm">
                          <span>Comandas</span>
                          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredGamesList.length === 0 && (
                  <div className="col-span-full bg-[#10131B] p-8 rounded-2xl text-center border border-dashed border-[#1E2436] text-slate-400 text-xs">
                    Nenhum jogo encontrado com os termos pesquisados.
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'products' ? (
            <ProductsView />
          ) : activeTab === 'schedules' ? (
            <SchedulesView />
          ) : (
            <ReportsView />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        activeLiveGame={activeLiveGame}
        onOpenLiveGame={handleOpenGame}
        onOpenNewGameModal={() => setIsNewGameModalOpen(true)}
        onOpenWhatsAppModal={() => setIsWhatsAppImportOpen(true)}
      />

      {/* WhatsApp Import Modal */}
      {isWhatsAppImportOpen && (
        <WhatsAppImportModal
          isOpen={isWhatsAppImportOpen}
          onClose={() => setIsWhatsAppImportOpen(false)}
          onGameCreated={(newGameId) => {
            setSelectedGameId(newGameId);
          }}
        />
      )}

      {/* Manual New Game Modal */}
      {isNewGameModalOpen && (
        <GameFormModal
          isOpen={isNewGameModalOpen}
          onClose={() => setIsNewGameModalOpen(false)}
          onSaved={(newGameId) => {
            setSelectedGameId(newGameId);
          }}
        />
      )}

      {/* System Logs and MySQL Audit Modal */}
      {isSystemLogsOpen && (
        <SystemLogsModal
          onClose={() => setIsSystemLogsOpen(false)}
        />
      )}
    </div>
  );
}
