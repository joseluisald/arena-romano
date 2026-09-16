import React, { useState } from 'react';
import { Game } from '../types';
import { store } from '../services/store';
import { formatCurrency } from '../utils/pricing';
import { 
  Flame, 
  Clock, 
  ArrowRight, 
  CalendarDays,
  Users,
  DollarSign,
  TrendingUp,
  Wine,
  ShieldCheck,
  ChevronRight,
  Plus,
  MessageSquareShare
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
  const liveGame = todayGames.find(g => g.status === 'em_andamento') || null;

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

    return {
      isToday,
      dayName,
      formatted: `${dayName}, ${d} de ${monthName}`
    };
  };

  const dateInfo = getFormattedDateHeader();
  const totalPlayersInDate = todayGames.reduce((acc, g) => acc + g.players.length, 0);
  const totalPresentInDate = todayGames.reduce((acc, g) => acc + g.players.filter(p => p.is_present).length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 md:pb-12 text-slate-100">
      
      {/* Top Banner: Date Bar & Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-md shadow-black/30">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {dateInfo.formatted}
            </h1>
            {dateInfo.isToday && (
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6600] bg-[#FF6600]/15 border border-[#FF6600]/30 px-2.5 py-0.5 rounded-full">
                Hoje
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Painel diário de ocupação de quadras, comandas individuais e receitas do bar.
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              const todayStr = new Date().toISOString().split('T')[0];
              setSelectedDate(todayStr);
            }}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-[#181D2B] hover:bg-[#20273A] text-slate-300 hover:text-white border border-[#23293D] transition-all cursor-pointer"
          >
            Hoje
          </button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs font-bold text-white bg-[#181D2B] hover:bg-[#20273A] px-3.5 py-2 rounded-xl border border-[#23293D] focus:border-[#FF6600] outline-none transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Metric Summary Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Receita Total
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(dailyStats.total_revenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">{formatCurrency(dailyStats.total_paid)}</span> recebido
          </p>
        </div>

        {/* Bar & Products */}
        <div className="bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Consumo do Bar
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-[#FF6600] border border-orange-500/20">
              <Wine size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(dailyStats.products_revenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Bebidas, carnes e petiscos
          </p>
        </div>

        {/* Games Count */}
        <div className="bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Partidas
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CalendarDays size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            {todayGames.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Quadra: {formatCurrency(dailyStats.court_revenue)}
          </p>
        </div>

        {/* Players Attendance */}
        <div className="bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Jogadores
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            {totalPresentInDate} <span className="text-slate-500 text-sm font-normal">/ {totalPlayersInDate}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Presentes confirmados
          </p>
        </div>
      </div>

      {/* Live Game Spotlight Featured Card */}
      {liveGame && (
        <div className="relative rounded-2xl bg-gradient-to-r from-[#211116] via-[#1A121A] to-[#12141F] border border-orange-500/40 p-5 sm:p-6 shadow-xl shadow-black/40 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6600] text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                  <Flame size={13} className="animate-bounce" /> Partida em Andamento
                </span>
                <span className="font-mono font-bold text-xs bg-black/60 px-2.5 py-1 rounded-lg border border-orange-500/30 text-orange-200">
                  {liveGame.start_time} - {liveGame.end_time}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {liveGame.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-slate-400" />
                  <strong className="text-white">{liveGame.players.filter(p => p.is_present).length}</strong> de {liveGame.players.length} presentes
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1.5">
                  <Wine size={14} className="text-[#FF6600]" />
                  Bar da Partida: <strong className="text-[#FF6600] font-mono text-sm">{formatCurrency(liveGame.players.reduce((s, p) => s + p.total_consumption, 0))}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => onOpenGame(liveGame.id)}
              className="px-6 py-3 rounded-xl bg-[#FF6600] hover:bg-[#FF7B1A] text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active-press shrink-0"
            >
              <span>Abrir Comandas da Partida</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Today's Games Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Jogos Agendados & Histórico</span>
            <span className="text-xs font-bold text-slate-400 bg-[#181D2B] px-2.5 py-0.5 rounded-full border border-[#23293D]">
              {todayGames.length}
            </span>
          </h2>
        </div>

        {todayGames.length === 0 ? (
          <div className="bg-[#10131B] rounded-2xl p-8 sm:p-12 text-center border border-dashed border-[#1E2436]">
            <div className="w-12 h-12 rounded-2xl bg-[#181D2B] border border-[#23293D] flex items-center justify-center mx-auto mb-3 text-slate-400">
              <CalendarDays size={24} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Nenhum jogo nesta data</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Você pode importar rapidamente uma lista copiada do grupo do WhatsApp ou criar um novo jogo manual.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {todayGames.map(game => {
              const gameConsumption = game.players.reduce((sum, p) => sum + p.total_consumption, 0);
              const presentCount = game.players.filter(p => p.is_present).length;
              const isLive = game.status === 'em_andamento';
              const isFinished = game.status === 'finalizado';

              return (
                <div
                  key={game.id}
                  onClick={() => onOpenGame(game.id)}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between group ${
                    isLive
                      ? 'bg-[#15141D] border-orange-500/40 hover:border-orange-500/70 shadow-md shadow-orange-500/5'
                      : 'bg-[#10131B] border-[#1E2436] hover:border-[#2B354F] hover:bg-[#131722]'
                  }`}
                >
                  <div>
                    {/* Header: Time & Status */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-mono font-bold text-xs bg-[#181D2B] px-2.5 py-1 rounded-lg border border-[#23293D] text-slate-200">
                          <Clock size={12} className="text-[#FF6600]" />
                          {game.start_time} - {game.end_time}
                        </span>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        isLive
                          ? 'bg-[#FF6600]/15 text-[#FF6600] border-[#FF6600]/30 animate-pulse'
                          : isFinished
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {isLive ? 'Ao Vivo' : isFinished ? 'Finalizado' : 'Agendado'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-base group-hover:text-[#FF6600] transition-colors line-clamp-1 mb-2">
                      {game.title}
                    </h3>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 py-2 border-y border-[#1B2132] my-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Presença</span>
                        <span className="font-bold text-white font-mono">{presentCount} / {game.players.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consumo Bar</span>
                        <span className="font-bold text-[#FF6600] font-mono">{formatCurrency(gameConsumption)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-between text-xs pt-1 text-slate-400 group-hover:text-white transition-colors">
                    <span className="font-semibold text-[11px]">Gerenciar Comandas</span>
                    <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
