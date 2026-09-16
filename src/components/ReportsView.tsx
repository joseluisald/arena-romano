import React, { useState } from 'react';
import { store } from '../services/store';
import { formatCurrency } from '../utils/pricing';
import { 
  TrendingUp, 
  Beer, 
  Users, 
  CalendarDays, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Share2, 
  Award,
  ShieldCheck,
  Check
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('hoje');
  const [customDate] = useState(() => new Date().toISOString().split('T')[0]);

  const allGames = store.getGames();

  // Filter games based on period
  const filteredGames = allGames.filter(g => {
    if (selectedPeriod === 'hoje') return g.date === customDate;
    if (selectedPeriod === 'semana') {
      const gDate = new Date(g.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - gDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (selectedPeriod === 'mes') {
      return g.date.substring(0, 7) === customDate.substring(0, 7);
    }
    return true;
  });

  // Calculate aggregates
  let totalGames = filteredGames.length;
  let totalPlayers = 0;
  let presentPlayers = 0;
  let courtRevenue = 0;
  let productsRevenue = 0;
  let totalPaid = 0;
  let totalPending = 0;

  const productCounts: { [name: string]: { qty: number; sales: number } } = {};
  const pendingPlayersList: Array<{
    gameId: string;
    gameTitle: string;
    gameDate: string;
    playerId: string;
    playerName: string;
    amount: number;
  }> = [];

  filteredGames.forEach(game => {
    courtRevenue += game.court_price || 0;

    game.players.forEach(p => {
      totalPlayers++;
      if (p.is_present) presentPlayers++;

      productsRevenue += p.total_consumption || 0;

      if (p.is_paid) {
        totalPaid += p.total_consumption || 0;
      } else if (p.total_consumption > 0) {
        totalPending += p.total_consumption || 0;
        pendingPlayersList.push({
          gameId: game.id,
          gameTitle: game.title,
          gameDate: game.date,
          playerId: p.id,
          playerName: p.name,
          amount: p.total_consumption,
        });
      }

      p.consumptions.forEach(c => {
        if (!productCounts[c.product_name]) {
          productCounts[c.product_name] = { qty: 0, sales: 0 };
        }
        productCounts[c.product_name].qty += c.quantity;
        productCounts[c.product_name].sales += c.calculated_total_price;
      });
    });
  });

  const grandTotalRevenue = courtRevenue + productsRevenue;

  const topProducts = Object.entries(productCounts)
    .map(([name, data]) => ({ name, qty: data.qty, sales: data.sales }))
    .sort((a, b) => b.qty - a.qty);

  const maxProductQty = topProducts.length > 0 ? topProducts[0].qty : 1;

  const handleMarkPlayerPaid = (gameId: string, playerId: string) => {
    store.setPlayerPayment(gameId, playerId, true, 'pix');
  };

  const handleSendReminderWhatsApp = (item: typeof pendingPlayersList[0]) => {
    const text = `Olá ${item.playerName}! ⚽ Aqui é da *Arena Romano*. Notamos uma comanda em aberto no jogo *${item.gameTitle}* no valor de *${formatCurrency(item.amount)}*. Chave Pix da quadra: contato@arenaromano.com.br. Obrigado!`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 md:pb-12 text-slate-100">
      
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-md shadow-black/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Relatórios Financeiros & Fechamento de Caixa
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Apuração de receitas de locação de quadra, consumo do bar e valores pendentes.
          </p>
        </div>

        {/* Period Filter Selector */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {(['hoje', 'semana', 'mes', 'todos'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                selectedPeriod === period
                  ? 'bg-[#FF6600] text-white shadow-sm'
                  : 'bg-[#181D2B] text-slate-400 hover:text-slate-200 border border-[#23293D] hover:bg-[#1E2538]'
              }`}
            >
              {period === 'hoje' ? 'Hoje' : period === 'semana' ? 'Últimos 7 Dias' : period === 'mes' ? 'Mês Atual' : 'Histórico Geral'}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Jogos Realizados</span>
            <CalendarDays size={16} className="text-blue-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white block font-mono">
            {totalGames}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {presentPlayers} jogadores presentes
          </span>
        </div>

        <div className="bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Locação Quadra</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white block font-mono">
            {formatCurrency(courtRevenue)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Média de {totalGames > 0 ? formatCurrency(courtRevenue / totalGames) : 'R$ 0,00'} / jogo
          </span>
        </div>

        <div className="bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Consumo Bar</span>
            <Beer size={16} className="text-[#FF6600]" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-[#FF6600] block font-mono">
            {formatCurrency(productsRevenue)}
          </span>
          <span className="text-[11px] text-emerald-400 font-bold">
            {totalPaid > 0 ? `${formatCurrency(totalPaid)} recebidos` : 'R$ 0,00 recebidos'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-[#1E1216] via-[#141724] to-[#10131B] p-4 sm:p-5 rounded-2xl border border-orange-500/30 shadow-md">
          <div className="flex items-center justify-between text-orange-300 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">Faturamento Total</span>
            <TrendingUp size={16} className="text-[#FF6600]" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white block font-mono">
            {formatCurrency(grandTotalRevenue)}
          </span>
          <span className="text-[11px] text-slate-300 font-medium">
            Quadra + Consumo do Bar
          </span>
        </div>
      </div>

      {/* Grid: Top Consumed Products vs Pending Receivables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Top Consumed Products */}
        <div className="bg-[#10131B] p-5 sm:p-6 rounded-2xl border border-[#1E2436] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-[#FF6600]" />
              <h3 className="text-base font-black text-white tracking-tight">Produtos Mais Vendidos</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">Volume Total</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 bg-[#0C0E15] rounded-xl border border-[#1A2030]">
              Nenhum produto consumido no período selecionado.
            </div>
          ) : (
            <div className="space-y-3.5">
              {topProducts.map((p, idx) => {
                const percentage = Math.round((p.qty / maxProductQty) * 100);
                return (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white flex items-center gap-2">
                        <span className="text-orange-400 font-mono text-[11px] font-black">#{idx + 1}</span>
                        {p.name}
                      </span>
                      <div className="text-right">
                        <span className="text-white font-black mr-2.5 font-mono">{p.qty} un</span>
                        <span className="text-[#FF6600] font-black font-mono">{formatCurrency(p.sales)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-[#0C0E15] rounded-full overflow-hidden border border-[#1A2030]">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF6600] to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Pending Debts List */}
        <div className="bg-[#10131B] p-5 sm:p-6 rounded-2xl border border-[#1E2436] shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-400" />
                <h3 className="text-base font-black text-white tracking-tight">Comandas Pendentes</h3>
              </div>
              <span className="text-xs font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono">
                {pendingPlayersList.length} jogador(es) • {formatCurrency(totalPending)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Controle de contas em aberto para recebimento no balcão ou via Pix.
            </p>

            {pendingPlayersList.length === 0 ? (
              <div className="text-center py-10 text-xs text-emerald-300 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                🎉 Tudo quitado! Nenhuma pendência no período selecionado.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 border border-[#1E2436] rounded-2xl p-2.5 bg-[#0C0E15] divide-y divide-[#1A2030]">
                {pendingPlayersList.map((item, idx) => (
                  <div
                    key={`${item.gameId}-${item.playerId}-${idx}`}
                    className="pt-2.5 first:pt-0 flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <span className="font-bold text-xs sm:text-sm text-white block truncate">
                        {item.playerName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.gameTitle} ({item.gameDate.split('-').reverse().join('/')})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-xs sm:text-sm text-amber-400 font-mono">
                        {formatCurrency(item.amount)}
                      </span>

                      <button
                        onClick={() => handleSendReminderWhatsApp(item)}
                        className="p-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-slate-300 hover:text-white transition-colors border border-[#25D366]/30 cursor-pointer"
                        title="Enviar cobrança via WhatsApp"
                      >
                        <Share2 size={13} />
                      </button>

                      <button
                        onClick={() => handleMarkPlayerPaid(item.gameId, item.playerId)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm active-press cursor-pointer"
                      >
                        Marcar Pago
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#1E2436] flex items-center justify-between text-xs text-slate-400">
            <span>Arena Romano • Gestão Financeira</span>
            <span className="text-emerald-400 font-medium">Contas atualizadas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
