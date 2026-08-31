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
  RefreshCw,
  RotateCcw,
  Sparkles,
  Award
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('hoje');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);

  const allGames = store.getGames();
  const todayStr = new Date().toISOString().split('T')[0];

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
    const text = `Olá ${item.playerName}! ⚽ Aqui é da *Arena Romano*. Verificamos uma pendência de consumo no jogo *${item.gameTitle}* no valor de *${formatCurrency(item.amount)}*. Chave Pix da quadra: contato@arenaromano.com.br. Obrigado!`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de demonstração iniciais da Arena Romano?')) {
      store.resetToDefaults();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-24 sm:pb-12 text-slate-100">
      
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121218] p-3.5 sm:p-4 rounded-2xl border border-[#20202c]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Relatórios & Fechamento Financeiro
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Faturamento da quadra, consumo do bar e controle de caixa.
          </p>
        </div>

        {/* Period Filter Selector */}
        <div className="flex items-center gap-1 flex-wrap text-xs">
          {(['hoje', 'semana', 'mes', 'todos'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedPeriod === period
                  ? 'bg-[#f27d26] text-white'
                  : 'bg-[#181822] text-slate-400 hover:text-slate-200 border border-[#28283a]'
              }`}
            >
              {period === 'hoje' ? 'Hoje' : period === 'semana' ? '7 Dias' : period === 'mes' ? 'Mês' : 'Geral'}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#111116] p-4 rounded-2xl border border-[#22222c] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Jogos Realizados</span>
            <CalendarDays size={18} className="text-orange-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white block">
            {totalGames}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {presentPlayers} jogadores presentes
          </span>
        </div>

        <div className="bg-[#111116] p-4 rounded-2xl border border-[#22222c] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Locação Quadra</span>
            <DollarSign size={18} className="text-orange-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white block">
            {formatCurrency(courtRevenue)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Média de {totalGames > 0 ? formatCurrency(courtRevenue / totalGames) : 'R$ 0,00'} / jogo
          </span>
        </div>

        <div className="bg-[#111116] p-4 rounded-2xl border border-[#22222c] shadow-lg">
          <div className="flex items-center justify-between text-orange-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Vendas de Bar</span>
            <Beer size={18} className="text-orange-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-[#f27d26] block">
            {formatCurrency(productsRevenue)}
          </span>
          <span className="text-[11px] text-emerald-400 font-bold">
            {totalPaid > 0 ? `${formatCurrency(totalPaid)} recebidos` : ''}
          </span>
        </div>

        <div className="bg-gradient-to-br from-[#181824] via-[#14141d] to-[#0f0f15] p-4 rounded-2xl border border-[#2e2e42] shadow-xl">
          <div className="flex items-center justify-between text-orange-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento Total</span>
            <TrendingUp size={18} className="text-orange-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white block">
            {formatCurrency(grandTotalRevenue)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Quadra + Consumo de Bar
          </span>
        </div>
      </div>

      {/* Grid: Top Consumed Products vs Pending Receivables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Top Consumed Products */}
        <div className="bg-[#111116] p-4 sm:p-5 rounded-2xl border border-[#22222c] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-orange-400" />
              <h3 className="text-base font-extrabold text-white">Produtos Mais Consumidos</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">Total Unidades</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Nenhum produto consumido no período selecionado.
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => {
                const percentage = Math.round((p.qty / maxProductQty) * 100);
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white flex items-center gap-1.5">
                        <span className="text-orange-400/80 font-mono text-[11px]">#{idx + 1}</span>
                        {p.name}
                      </span>
                      <div className="text-right">
                        <span className="text-white font-black mr-2">{p.qty} un</span>
                        <span className="text-[#f27d26] font-semibold">{formatCurrency(p.sales)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-[#0c0c11] rounded-full overflow-hidden border border-[#22222c]">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
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
        <div className="bg-[#111116] p-4 sm:p-5 rounded-2xl border border-[#22222c] shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Valores Pendentes</h3>
              </div>
              <span className="text-xs font-extrabold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                {pendingPlayersList.length} jogador(es) • {formatCurrency(totalPending)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Controle de contas em aberto para recebimento no Pix ou balcão.
            </p>

            {pendingPlayersList.length === 0 ? (
              <div className="text-center py-8 text-xs text-emerald-300 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                🎉 Tudo em dia! Nenhuma conta pendente no período.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 border border-[#22222c] rounded-xl p-2 bg-[#0c0c11] divide-y divide-[#1c1c28]">
                {pendingPlayersList.map((item, idx) => (
                  <div
                    key={`${item.gameId}-${item.playerId}-${idx}`}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-2"
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
                      <span className="font-black text-xs sm:text-sm text-amber-400">
                        {formatCurrency(item.amount)}
                      </span>

                      <button
                        onClick={() => handleSendReminderWhatsApp(item)}
                        className="p-1.5 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366] text-slate-300 hover:text-white transition-colors border border-[#25D366]/30 cursor-pointer"
                        title="Enviar cobrança WhatsApp"
                      >
                        <Share2 size={13} />
                      </button>

                      <button
                        onClick={() => handleMarkPlayerPaid(item.gameId, item.playerId)}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm active-press cursor-pointer"
                      >
                        Marcar Pago
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset Store Action */}
          <div className="pt-3 border-t border-[#22222c] flex items-center justify-between text-xs text-slate-400">
            <span>Arena Romano v1.2</span>
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-orange-400 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw size={12} />
              Restaurar Dados Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
