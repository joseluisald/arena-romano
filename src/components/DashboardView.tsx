import React, { useState } from 'react';
import { Game } from '../types';
import { store } from '../services/store';
import { formatCurrency } from '../utils/pricing';
import { 
  Flame, 
  Clock, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';

interface DashboardViewProps {
  onOpenGame: (gameId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenGame,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const allGames = store.getGames();
  const todayGames = allGames.filter(g => g.date === selectedDate);
  const dailyStats = store.getDailyStats(selectedDate);
  const liveGame = todayGames.find(g => g.status === 'em_andamento') || todayGames[0] || null;

  // Format date header
  const getFormattedDateHeader = () => {
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = daysOfWeek[dateObj.getDay()];
    const monthName = months[m - 1];

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === todayStr;

    return `${isToday ? 'Hoje • ' : ''}${dayName}, ${d} ${monthName}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-24 sm:pb-12 text-slate-100">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121218] p-3.5 sm:p-4 rounded-2xl border border-[#20202c]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {getFormattedDateHeader()}
            </h1>
            <span className="text-[11px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.2 rounded-md">
              Arena Romano
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Controle de partidas, bar e comandas individuais.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Data:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs font-semibold text-white bg-[#181822] hover:bg-[#20202e] px-3 py-1.5 rounded-xl border border-[#28283a] focus:border-[#f27d26] outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Live Game Spotlight (Compact) */}
      {liveGame && liveGame.status === 'em_andamento' && (
        <div className="rounded-2xl bg-[#15151f] text-white p-3.5 sm:p-4 border border-orange-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f27d26] text-white text-[10px] font-bold uppercase">
                <Flame size={11} /> Em Andamento
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {liveGame.start_time} - {liveGame.end_time}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {liveGame.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
              <span>{liveGame.players.filter(p => p.is_present).length} presentes</span>
              <span>•</span>
              <span>Bar: <strong className="text-[#f27d26]">{formatCurrency(liveGame.players.reduce((s, p) => s + p.total_consumption, 0))}</strong></span>
            </div>
          </div>

          <button
            onClick={() => onOpenGame(liveGame.id)}
            className="px-4 py-2 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>Ver Comandas</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Games List for Selected Date */}
      <div className="space-y-2.5">
        <h2 className="text-sm font-bold text-white tracking-tight">
          Partidas Cadastradas ({todayGames.length})
        </h2>

        {todayGames.length === 0 ? (
          <div className="bg-[#121218] rounded-xl p-6 text-center border border-dashed border-[#20202c]">
            <p className="text-xs text-slate-400">
              Nenhuma partida nesta data. Use os botões <strong className="text-emerald-400">WhatsApp</strong> ou <strong className="text-orange-400">Novo Jogo</strong> no topo para cadastrar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {todayGames.map(game => {
              const gameConsumption = game.players.reduce((sum, p) => sum + p.total_consumption, 0);
              const presentCount = game.players.filter(p => p.is_present).length;

              return (
                <div
                  key={game.id}
                  onClick={() => onOpenGame(game.id)}
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
                          ({game.duration_minutes || 60}m)
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
                        {formatCurrency(gameConsumption)}
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
                        onOpenGame(game.id);
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
          </div>
        )}
      </div>

      {/* Pending Balances Alert */}
      {dailyStats.total_pending > 0 && (
        <div className="bg-[#18130e] rounded-xl p-3 border border-amber-900/40 text-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <span>Valores Pendentes no Caixa Hoje: <strong className="text-amber-100">{formatCurrency(dailyStats.total_pending)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
