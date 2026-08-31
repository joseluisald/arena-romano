import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { GameDetailsView } from './components/GameDetailsView';
import { ProductsView } from './components/ProductsView';
import { SchedulesView } from './components/SchedulesView';
import { ReportsView } from './components/ReportsView';
import { WhatsAppImportModal } from './components/WhatsAppImportModal';
import { GameFormModal } from './components/GameFormModal';
import { store } from './services/store';
import { formatCurrency } from './utils/pricing';
import { 
  CalendarDays, 
  Clock, 
  Users, 
  Beer, 
  ArrowRight, 
  Plus, 
  MessageSquareShare, 
  Search,
  Filter
} from 'lucide-react';

export default function App() {
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

  // Games Tab Filter State
  const [gamesSearch, setGamesSearch] = useState('');
  const [gamesStatusFilter, setGamesStatusFilter] = useState<'todos' | 'agendado' | 'em_andamento' | 'finalizado'>('todos');

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
    <div className="min-h-screen bg-[#09090b] text-slate-100 font-sans flex flex-col md:flex-row selection:bg-[#f27d26] selection:text-white">
      {/* Immersive UI Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        activeLiveGame={activeLiveGame}
        onOpenLiveGame={handleOpenGame}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
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
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-24 sm:pb-12 text-slate-100">
              
              {/* Clean Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121218] p-3.5 sm:p-4 rounded-2xl border border-[#20202c]">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Jogos & Histórico
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Todas as partidas e comandas cadastradas na Arena Romano.
                  </p>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar jogo..."
                    value={gamesSearch}
                    onChange={e => setGamesSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#20202c] bg-[#121218] text-white placeholder:text-slate-500 focus:border-[#f27d26] outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'em_andamento', label: 'Em Andamento' },
                    { id: 'agendado', label: 'Agendados' },
                    { id: 'finalizado', label: 'Finalizados' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setGamesStatusFilter(s.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        gamesStatusFilter === s.id
                          ? 'bg-[#f27d26] text-white'
                          : 'bg-[#121218] text-slate-400 hover:text-slate-200 border border-[#20202c]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredGamesList.map(game => {
                  const consumption = game.players.reduce((sum, p) => sum + p.total_consumption, 0);
                  const presentCount = game.players.filter(p => p.is_present).length;

                  return (
                    <div
                      key={game.id}
                      onClick={() => handleOpenGame(game.id)}
                      className={`rounded-xl p-3 border transition-all hover:border-[#353548] cursor-pointer flex flex-col justify-between ${
                        game.status === 'em_andamento'
                          ? 'bg-[#15131b] border-orange-500/50 shadow-sm'
                          : 'bg-[#121218] border-[#20202c]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-orange-400" />
                            <span className="font-mono font-bold text-xs text-white">
                              {game.start_time}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              • {game.date.split('-').reverse().join('/')}
                            </span>
                          </div>

                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            game.status === 'em_andamento'
                              ? 'bg-orange-500 text-white'
                              : game.status === 'finalizado'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-sky-500/15 text-sky-300'
                          }`}>
                            {game.status === 'em_andamento' ? 'Em Andamento' : game.status === 'finalizado' ? 'Finalizado' : 'Agendado'}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white truncate">
                          {game.title}
                        </h3>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1e1e28] text-xs">
                          <span className="text-[11px] text-slate-400">
                            {presentCount}/{game.players.length} presentes
                          </span>
                          <span className="font-bold text-[#f27d26] font-mono text-xs">
                            {formatCurrency(consumption)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#1e1e28] flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Quadra: {formatCurrency(game.court_price)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenGame(game.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#1a1a24] hover:bg-[#f27d26] text-slate-200 hover:text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Abrir</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredGamesList.length === 0 && (
                  <div className="col-span-full bg-[#121218] p-6 rounded-xl text-center border border-dashed border-[#20202c] text-slate-400 text-xs">
                    Nenhum jogo encontrado com os filtros informados.
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
    </div>
  );
}
