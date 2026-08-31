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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#111116] rounded-2xl shadow-2xl border border-[#272736] overflow-hidden my-auto max-h-[95vh] flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="bg-[#161622] text-white px-5 py-4 flex items-center justify-between border-b border-[#262638]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#f27d26] text-white shadow-md shadow-orange-500/20">
              <Flag size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">Fechamento do Jogo</h2>
              <p className="text-xs text-slate-400">
                {game.title} • {game.start_time} • {game.players.length} jogadores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#0c0c11] p-3 rounded-xl border border-[#22222c]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quadra</span>
              <span className="text-base sm:text-lg font-extrabold text-white">
                {formatCurrency(game.court_price || 0)}
              </span>
            </div>

            <div className="bg-[#0c0c11] p-3 rounded-xl border border-[#22222c]">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">Consumo</span>
              <span className="text-base sm:text-lg font-extrabold text-[#f27d26]">
                {formatCurrency(totalConsumption)}
              </span>
            </div>

            <div className="bg-[#0c0c11] p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Recebido</span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-400">
                {formatCurrency(totalPaid)}
              </span>
            </div>

            <div className="bg-[#0c0c11] p-3 rounded-xl border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Pendente</span>
              <span className="text-base sm:text-lg font-extrabold text-amber-400">
                {formatCurrency(totalPending)}
              </span>
            </div>
          </div>

          {/* Grand Total Hero Banner */}
          <div className="bg-gradient-to-br from-[#181824] via-[#14141e] to-[#0c0c11] text-white p-4 rounded-2xl shadow-xl border border-[#262638] flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                Valor Total do Jogo (Quadra + Bar)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {formatCurrency(totalGameValue)}
              </span>
            </div>

            <div className="text-right text-xs text-slate-300">
              <span className="block font-semibold text-slate-400">Status do Jogo:</span>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase mt-1 ${
                game.status === 'finalizado' ? 'bg-emerald-600 text-white' : 'bg-[#f27d26] text-white shadow-md shadow-orange-500/20'
              }`}>
                {game.status === 'finalizado' ? 'Finalizado' : 'Em Andamento'}
              </span>
            </div>
          </div>

          {/* Quick Actions for WhatsApp Group Share */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-[#0c0c11] hover:bg-[#181822] text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#262638] active-press"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? 'Copiado para o Clipboard!' : 'Copiar Resumo'}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex-1 min-w-[160px] px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active-press"
            >
              <Share2 size={16} />
              Enviar no WhatsApp do Grupo
            </button>
          </div>

          {/* Individual Player Payment Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-orange-400" /> Fechamento por Jogador ({game.players.length})
              </span>
              <span className="text-xs text-slate-400">
                {paidPlayersCount} pagos • {pendingPlayersCount} pendentes
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto border border-[#22222c] rounded-xl divide-y divide-[#1c1c28] bg-[#0c0c11]">
              {game.players.map(player => (
                <div
                  key={player.id}
                  className="p-3 flex items-center justify-between gap-2 hover:bg-[#161622] transition-colors"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-[#161622] text-orange-400 border border-[#262638] font-bold text-xs flex items-center justify-center shrink-0">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-xs sm:text-sm text-white block truncate">
                        {player.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {player.consumptions.length > 0
                          ? `${player.consumptions.reduce((s, c) => s + c.quantity, 0)} itens consumidos`
                          : 'Sem consumo'}
                      </span>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right shrink-0">
                    <span className="font-black text-xs sm:text-sm text-[#f27d26] block">
                      {formatCurrency(player.total_consumption)}
                    </span>
                  </div>

                  {/* Toggle Paid Button */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePlayerPayment(player.id, player.is_paid, 'pix')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        player.is_paid
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                      }`}
                    >
                      {player.is_paid ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          Pago ({player.payment_method?.toUpperCase() || 'PIX'})
                        </>
                      ) : (
                        'Pendente (Marcar Pago)'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#161622] px-5 py-3.5 border-t border-[#262638] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-white font-semibold text-xs sm:text-sm hover:bg-[#20202e] transition-colors cursor-pointer border border-[#272738]"
          >
            Fechar Janela
          </button>

          {game.status === 'finalizado' ? (
            <button
              type="button"
              onClick={handleReopenGame}
              className="px-4 py-2 rounded-xl bg-[#20202e] hover:bg-[#28283a] text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer border border-[#272738]"
            >
              Reabrir Jogo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalizeGame}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all active-press cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              Finalizar Jogo Oficialmente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
