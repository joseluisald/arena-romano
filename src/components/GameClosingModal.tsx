import React, { useState } from 'react';
import { Game, PaymentMethod } from '../types';
import { store } from '../services/store';
import { formatCurrency } from '../utils/pricing';
import confetti from 'canvas-confetti';
import { 
  X, 
  CheckCircle2, 
  DollarSign, 
  Copy, 
  Share2, 
  Check, 
  Sparkles,
  Users,
  Flag,
  ArrowRight
} from 'lucide-react';

interface GameClosingModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onGameFinalized?: () => void;
}

export const GameClosingModal: React.FC<GameClosingModalProps> = ({
  game,
  isOpen,
  onClose,
  onGameFinalized,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalConsumption = game.players.reduce((sum, p) => sum + (p.total_consumption || 0), 0);
  const totalGameValue = totalConsumption + (game.court_price || 0);

  const totalPaid = game.players.filter(p => p.is_paid).reduce((sum, p) => sum + (p.total_consumption || 0), 0);
  const totalPending = game.players.filter(p => !p.is_paid).reduce((sum, p) => sum + (p.total_consumption || 0), 0);
  const paidPlayersCount = game.players.filter(p => p.is_paid).length;
  const pendingPlayersCount = game.players.filter(p => !p.is_paid && p.total_consumption > 0).length;

  const handleTogglePlayerPayment = (playerId: string, currentPaid: boolean, defaultMethod: PaymentMethod = 'pix') => {
    store.setPlayerPayment(game.id, playerId, !currentPaid, !currentPaid ? defaultMethod : undefined);
  };

  const handleFinalizeGame = () => {
    store.setGameStatus(game.id, 'finalizado');
    
    // Celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F97316', '#10B981', '#FBBF24', '#6366F1'],
      });
    } catch (e) {
      console.log('Confetti triggered', e);
    }

    if (onGameFinalized) {
      onGameFinalized();
    }
  };

  const handleReopenGame = () => {
    store.setGameStatus(game.id, 'em_andamento');
  };

  const generateWhatsAppSummary = () => {
    const lines = [
      `🏟️ *ARENA ROMANO — RESUMO DO JOGO*`,
      `⚽ *${game.title.toUpperCase()}*`,
      `📅 Data: ${game.date.split('-').reverse().join('/')} | ⏰ Horário: ${game.start_time}`,
      `👥 Total de Jogadores: ${game.players.length}`,
      ``,
      `📊 *VALORES DO JOGO:*`,
      `• Quadra: ${formatCurrency(game.court_price || 0)}`,
      `• Consumo Total: ${formatCurrency(totalConsumption)}`,
      `💰 *TOTAL GERAL: ${formatCurrency(totalGameValue)}*`,
      ``,
      `📋 *CONSUMO INDIVIDUAL DOS JOGADORES:*`,
      `-----------------------------------------`,
    ];

    game.players.forEach(p => {
      const statusIcon = p.is_paid ? `✅ PAGO (${p.payment_method?.toUpperCase()})` : (p.total_consumption > 0 ? `⏳ PENDENTE` : `✔️ Sem consumo`);
      lines.push(`${p.name.padEnd(16, ' ')} : ${formatCurrency(p.total_consumption)}  [${statusIcon}]`);
    });

    lines.push(`-----------------------------------------`);
    lines.push(`💵 *Total Recebido:* ${formatCurrency(totalPaid)}`);
    lines.push(`⚠️ *Total Pendente:* ${formatCurrency(totalPending)}`);
    lines.push(``);
    lines.push(`_Arena Romano • Centro Esportivo_`);

    return lines.join('\n');
  };

  const handleCopySummary = () => {
    const text = generateWhatsAppSummary();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppSummary();
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-2xl bg-[#111116] rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#272736] overflow-hidden max-h-[94vh] sm:max-h-[95vh] flex flex-col text-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden w-12 h-1 bg-slate-700/60 rounded-full mx-auto mt-2 mb-1" />

        {/* Header */}
        <div className="bg-[#161622] text-white px-4 sm:px-5 py-3 flex items-center justify-between border-b border-[#262638]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#f27d26] text-white shadow-md shadow-orange-500/20 shrink-0">
              <Flag size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">Fechamento do Jogo</h2>
              <p className="text-[11px] text-slate-400">
                {game.title} • {game.start_time} • {game.players.length} jogadores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active-press"
          >
            <X size={19} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 touch-pan-y">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#0c0c11] p-2.5 rounded-xl border border-[#22222c]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quadra</span>
              <span className="text-sm sm:text-base font-extrabold text-white">
                {formatCurrency(game.court_price || 0)}
              </span>
            </div>

            <div className="bg-[#0c0c11] p-2.5 rounded-xl border border-[#22222c]">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">Consumo</span>
              <span className="text-sm sm:text-base font-extrabold text-[#f27d26]">
                {formatCurrency(totalConsumption)}
              </span>
            </div>

            <div className="bg-[#0c0c11] p-2.5 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Recebido</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400">
                {formatCurrency(totalPaid)}
              </span>
            </div>

            <div className="bg-[#0c0c11] p-2.5 rounded-xl border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Pendente</span>
              <span className="text-sm sm:text-base font-extrabold text-amber-400">
                {formatCurrency(totalPending)}
              </span>
            </div>
          </div>

          {/* Grand Total Hero Banner */}
          <div className="bg-gradient-to-br from-[#181824] via-[#14141e] to-[#0c0c11] text-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-[#262638] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Valor Total (Quadra + Bar)
              </span>
              <span className="text-xl sm:text-3xl font-black text-white font-mono">
                {formatCurrency(totalGameValue)}
              </span>
            </div>

            <div className="text-right text-xs text-slate-300">
              <span className="block font-semibold text-slate-400 text-[10px]">Status:</span>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase mt-0.5 ${
                game.status === 'finalizado' ? 'bg-emerald-600 text-white' : 'bg-[#f27d26] text-white shadow-sm'
              }`}>
                {game.status === 'finalizado' ? 'Finalizado' : 'Em Andamento'}
              </span>
            </div>
          </div>

          {/* Quick Actions for WhatsApp Group Share */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0c0c11] hover:bg-[#181822] text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#262638] active-press min-h-[42px]"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{copied ? 'Copiado para o Clipboard!' : 'Copiar Resumo'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active-press min-h-[42px]"
            >
              <Share2 size={16} />
              <span>Enviar no WhatsApp do Grupo</span>
            </button>
          </div>

          {/* Individual Player Payment Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={13} className="text-orange-400" /> Fechamento por Jogador ({game.players.length})
              </span>
              <span className="text-[11px] text-slate-400">
                {paidPlayersCount} pagos • {pendingPlayersCount} pendentes
              </span>
            </div>

            <div className="max-h-60 sm:max-h-64 overflow-y-auto border border-[#22222c] rounded-2xl divide-y divide-[#1c1c28] bg-[#0c0c11]">
              {game.players.map(player => (
                <div
                  key={player.id}
                  className="p-2.5 sm:p-3 flex items-center justify-between gap-2 hover:bg-[#161622] transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-[#161622] text-orange-400 border border-[#262638] font-bold text-xs flex items-center justify-center shrink-0">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-xs sm:text-sm text-white block truncate">
                        {player.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {player.consumptions.length > 0
                          ? `${player.consumptions.reduce((s, c) => s + c.quantity, 0)} itens consumidos`
                          : 'Sem consumo'}
                      </span>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right shrink-0">
                    <span className="font-black text-xs sm:text-sm text-[#f27d26] font-mono block">
                      {formatCurrency(player.total_consumption)}
                    </span>
                  </div>

                  {/* Toggle Paid Button */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePlayerPayment(player.id, player.is_paid, 'pix')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active-press min-h-[34px] ${
                        player.is_paid
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                      }`}
                    >
                      {player.is_paid ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span>{player.payment_method?.toUpperCase() || 'PAGO'}</span>
                        </>
                      ) : (
                        <span>Pagar</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#161622] px-4 sm:px-5 py-3 border-t border-[#262638] flex items-center justify-between gap-2 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white font-semibold text-xs hover:bg-[#20202e] transition-colors cursor-pointer border border-[#272738] min-h-[42px]"
          >
            Fechar
          </button>

          {game.status === 'finalizado' ? (
            <button
              type="button"
              onClick={handleReopenGame}
              className="px-4 py-2.5 rounded-xl bg-[#20202e] hover:bg-[#28283a] text-slate-200 font-bold text-xs transition-colors cursor-pointer border border-[#272738] min-h-[42px]"
            >
              Reabrir Jogo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalizeGame}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all active-press cursor-pointer flex items-center justify-center gap-1.5 min-h-[42px]"
            >
              <CheckCircle2 size={16} />
              <span>Finalizar Jogo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
