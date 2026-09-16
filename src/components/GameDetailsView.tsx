import React, { useState } from 'react';
import { Game, GamePlayer, GameStatus } from '../types';
import { store } from '../services/store';
import { formatCurrency } from '../utils/pricing';
import { PlayerComandaModal } from './PlayerComandaModal';
import { GameClosingModal } from './GameClosingModal';
import { GameFormModal } from './GameFormModal';
import { BulkExpenseModal } from './BulkExpenseModal';
import { 
  Users, 
  Beer, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  ChevronLeft, 
  Edit3, 
  Trash2, 
  Flag, 
  UserCheck, 
  UtensilsCrossed,
  LayoutGrid,
  List,
  DollarSign,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

interface GameDetailsViewProps {
  gameId: string;
  onBack: () => void;
}

export const GameDetailsView: React.FC<GameDetailsViewProps> = ({
  gameId,
  onBack,
}) => {
  const game = store.getGame(gameId);
  const [selectedPlayerForComanda, setSelectedPlayerForComanda] = useState<GamePlayer | null>(null);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isEditGameModalOpen, setIsEditGameModalOpen] = useState(false);
  const [isBulkExpenseModalOpen, setIsBulkExpenseModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'todos' | 'presentes' | 'consumo' | 'pendentes' | 'pagos'>('todos');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');
  
  // New player inline addition
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-slate-400 mb-4">Jogo não encontrado ou excluído.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-[#FF6600] text-white rounded-xl font-bold text-xs cursor-pointer shadow-md"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  const totalConsumption = game.players.reduce((sum, p) => sum + (p.total_consumption || 0), 0);
  const totalGrand = totalConsumption + (game.court_price || 0);
  const presentCount = game.players.filter(p => p.is_present).length;
  const paidCount = game.players.filter(p => p.is_paid).length;

  // Filter players
  const filteredPlayers = game.players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMode === 'presentes') return p.is_present;
    if (filterMode === 'consumo') return p.total_consumption > 0;
    if (filterMode === 'pendentes') return !p.is_paid && p.total_consumption > 0;
    if (filterMode === 'pagos') return p.is_paid;
    return true;
  });

  const handleStatusChange = (newStatus: GameStatus) => {
    store.setGameStatus(game.id, newStatus);
  };

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      store.addPlayer(game.id, newPlayerName.trim());
      setNewPlayerName('');
      setIsAddingPlayer(false);
    }
  };

  const handleTogglePresence = (playerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.togglePlayerPresence(game.id, playerId);
  };

  const handleMarkAllPresent = () => {
    store.markAllPresent(game.id);
  };

  const handleDeleteGame = () => {
    if (confirm(`Deseja realmente excluir o jogo "${game.title}"? Todos os consumos associados serão apagados.`)) {
      store.deleteGame(game.id);
      onBack();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 md:pb-12 text-slate-100">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer bg-[#10131B] hover:bg-[#181D2B] px-3.5 py-2 rounded-xl border border-[#1E2436]"
        >
          <ChevronLeft size={16} />
          <span>Voltar para Lista</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Lançar Churrasco / Rateio Geral Button */}
          <button
            onClick={() => setIsBulkExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-xs font-bold transition-all cursor-pointer"
            title="Lançar churrasco ou rateio para todos"
          >
            <UtensilsCrossed size={14} />
            <span className="hidden sm:inline">Rateio Churrasco</span>
            <span className="sm:hidden">Rateio</span>
          </button>

          {/* Fechamento do Jogo */}
          <button
            onClick={() => setIsClosingModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Flag size={14} />
            <span>Fechamento</span>
          </button>

          <button
            onClick={() => setIsEditGameModalOpen(true)}
            className="p-2 rounded-xl bg-[#10131B] hover:bg-[#181D2B] text-slate-300 hover:text-white border border-[#1E2436] transition-colors cursor-pointer"
            title="Editar informações do jogo"
          >
            <Edit3 size={15} />
          </button>

          <button
            onClick={handleDeleteGame}
            className="p-2 rounded-xl bg-[#10131B] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-[#1E2436] hover:border-rose-500/30 transition-colors cursor-pointer"
            title="Excluir jogo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Game Summary Header Card */}
      <div className="bg-[#10131B] text-white rounded-2xl p-5 sm:p-6 border border-[#1E2436] shadow-md shadow-black/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold bg-[#181D2B] px-3 py-1 rounded-lg text-[#FF6600] border border-[#23293D] flex items-center gap-1.5">
                <Clock size={13} />
                {game.start_time} - {game.end_time}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {game.date.split('-').reverse().join('/')}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1.5">
              {game.title}
            </h1>
            {game.notes && (
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {game.notes}
              </p>
            )}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status:</span>
            <select
              value={game.status}
              onChange={e => handleStatusChange(e.target.value as GameStatus)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider outline-none cursor-pointer border ${
                game.status === 'em_andamento'
                  ? 'bg-[#FF6600] text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : game.status === 'finalizado'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-[#181D2B] text-slate-200 border-[#23293D]'
              }`}
            >
              <option value="agendado">Agendado</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        {/* Compact KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[#1B2132]">
          <div className="bg-[#141824] p-3 rounded-xl border border-[#1E2538]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Jogadores</span>
            <span className="text-base sm:text-lg font-black text-white font-mono">
              {presentCount} / {game.players.length} <span className="text-xs font-normal text-slate-400">presentes</span>
            </span>
          </div>

          <div className="bg-[#141824] p-3 rounded-xl border border-[#1E2538]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Consumo Bar</span>
            <span className="text-base sm:text-lg font-black text-[#FF6600] font-mono">
              {formatCurrency(totalConsumption)}
            </span>
          </div>

          <div className="bg-[#141824] p-3 rounded-xl border border-[#1E2538]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Quadra</span>
            <span className="text-base sm:text-lg font-black text-slate-200 font-mono">
              {formatCurrency(game.court_price)}
            </span>
          </div>

          <div className="bg-[#141824] p-3 rounded-xl border border-[#1E2538]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Geral</span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              {formatCurrency(totalGrand)}
            </span>
          </div>
        </div>
      </div>

      {/* Roster Controls: Search, Filters & Action Buttons */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar jogador na comanda..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#1E2436] bg-[#10131B] text-white placeholder:text-slate-400 focus:border-[#FF6600] outline-none transition-colors"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-2 rounded-xl bg-[#10131B] hover:bg-[#181D2B] text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-[#1E2436] transition-colors cursor-pointer"
            >
              <UserCheck size={14} className="text-emerald-400" />
              <span>Todos Presentes</span>
            </button>

            <button
              onClick={() => setIsAddingPlayer(!isAddingPlayer)}
              className="px-3.5 py-2 rounded-xl bg-[#FF6600] hover:bg-[#FF7B1A] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Jogador</span>
            </button>

            {/* Layout Toggle */}
            <div className="hidden sm:flex items-center border border-[#1E2436] rounded-xl bg-[#10131B] p-0.5">
              <button
                onClick={() => setViewLayout('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewLayout === 'cards' ? 'bg-[#1E2436] text-white' : 'text-slate-500 hover:text-slate-300'}`}
                title="Visualização em Cards"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewLayout === 'table' ? 'bg-[#1E2436] text-white' : 'text-slate-500 hover:text-slate-300'}`}
                title="Visualização em Lista"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Inline Add Player */}
        {isAddingPlayer && (
          <div className="p-3 bg-[#121622] border border-orange-500/40 rounded-xl flex items-center gap-2 shadow-lg">
            <input
              type="text"
              placeholder="Digite o nome do jogador..."
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddPlayer();
              }}
              autoFocus
              className="px-3 py-2 text-xs sm:text-sm bg-[#0C0E15] text-white rounded-lg border border-[#23293D] focus:border-[#FF6600] outline-none flex-1 font-semibold"
            />
            <button
              onClick={handleAddPlayer}
              className="px-4 py-2 bg-[#FF6600] text-white text-xs font-bold rounded-lg hover:bg-[#FF7B1A] cursor-pointer"
            >
              Salvar
            </button>
            <button
              onClick={() => setIsAddingPlayer(false)}
              className="px-3 py-2 bg-[#1A2030] text-slate-300 text-xs rounded-lg hover:bg-[#222A40] cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'todos', label: `Todos (${game.players.length})` },
            { id: 'presentes', label: `Presentes (${presentCount})` },
            { id: 'consumo', label: `Com Consumo (${game.players.filter(p => p.total_consumption > 0).length})` },
            { id: 'pendentes', label: `Pendentes (${game.players.filter(p => !p.is_paid && p.total_consumption > 0).length})` },
            { id: 'pagos', label: `Pagos (${paidCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterMode === f.id
                  ? 'bg-[#FF6600] text-white shadow-sm'
                  : 'bg-[#10131B] text-slate-400 hover:text-slate-200 border border-[#1E2436] hover:bg-[#141824]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Players List: Table View OR Cards Grid */}
      {viewLayout === 'table' ? (
        <div className="bg-[#10131B] rounded-2xl border border-[#1E2436] overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C0E15] text-slate-400 border-b border-[#1E2436]">
              <tr>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px]">#</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px]">Jogador</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px]">Presença</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px]">Itens Consumidos</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Total Bar</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-center">Status</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2030]">
              {filteredPlayers.map((player, idx) => (
                <tr 
                  key={player.id}
                  onClick={() => setSelectedPlayerForComanda(player)}
                  className="hover:bg-[#141824] transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3.5 text-slate-500 font-mono text-[11px] font-bold">{idx + 1}</td>
                  <td className="py-2.5 px-3.5 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#181D2B] text-slate-300 flex items-center justify-center text-[10px] font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{player.name}</span>
                      {player.raw_tag && (
                        <span className="text-[10px] bg-orange-500/15 text-orange-300 border border-orange-500/20 px-1.5 py-0.5 rounded font-bold">
                          {player.raw_tag}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <button
                      type="button"
                      onClick={(e) => handleTogglePresence(player.id, e)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        player.is_present
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-[#181D2B] text-slate-400 border border-[#23293D]'
                      }`}
                    >
                      {player.is_present ? 'Presente' : 'Ausente'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300">
                    {player.consumptions.length > 0 ? (
                      <span className="text-xs text-slate-300">
                        {player.consumptions.map(c => `${c.quantity}x ${c.product_name.split(' ')[0]}`).join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-black text-[#FF6600] font-mono text-sm">
                    {formatCurrency(player.total_consumption)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    {player.total_consumption > 0 ? (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        player.is_paid ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                      }`}>
                        {player.is_paid ? 'PAGO' : 'PENDENTE'}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlayerForComanda(player);
                      }}
                      className="px-3 py-1 bg-[#FF6600] hover:bg-[#FF7B1A] text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Comanda
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPlayers.map((player, idx) => {
            const hasConsumption = player.total_consumption > 0;

            return (
              <div
                key={player.id}
                onClick={() => setSelectedPlayerForComanda(player)}
                className={`bg-[#10131B] rounded-2xl p-4 border transition-all hover:border-[#2B354F] hover:bg-[#131722] cursor-pointer flex flex-col justify-between group ${
                  hasConsumption
                    ? 'border-[#23293D] shadow-sm'
                    : 'border-[#1E2436] opacity-95'
                }`}
              >
                <div>
                  {/* Player Name + Presence Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-[#181D2B] text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm text-white truncate group-hover:text-[#FF6600] transition-colors">
                        {player.name}
                      </span>
                      {player.raw_tag && (
                        <span className="px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-300 text-[9px] font-bold shrink-0 border border-orange-500/20">
                          {player.raw_tag}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleTogglePresence(player.id, e)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer transition-colors ${
                        player.is_present
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-[#181D2B] text-slate-400 border border-[#23293D]'
                      }`}
                    >
                      {player.is_present ? 'Presente' : 'Ausente'}
                    </button>
                  </div>

                  {/* Consumed items snippet */}
                  <div className="py-2 px-3 rounded-xl bg-[#0C0E15] border border-[#1A2030] flex items-center justify-between text-xs my-2">
                    <span className="text-slate-400 text-[11px] font-semibold">Total Consumo:</span>
                    <span className={`font-black font-mono text-sm ${hasConsumption ? 'text-[#FF6600]' : 'text-slate-500'}`}>
                      {formatCurrency(player.total_consumption)}
                    </span>
                  </div>

                  {/* Items tags */}
                  {player.consumptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 my-2">
                      {player.consumptions.map(c => (
                        <span
                          key={c.id}
                          className="text-[10px] bg-[#181D2B] text-slate-300 px-2 py-0.5 rounded-md border border-[#23293D] font-medium"
                        >
                          {c.quantity}x {c.product_name.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="pt-2.5 flex items-center justify-between border-t border-[#1A2030] mt-2">
                  <div>
                    {hasConsumption ? (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        player.is_paid
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {player.is_paid ? 'PAGO' : 'PENDENTE'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sem consumo</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlayerForComanda(player);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#181D2B] group-hover:bg-[#FF6600] text-slate-200 group-hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  >
                    <Plus size={13} />
                    <span>Lançar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredPlayers.length === 0 && (
        <div className="bg-[#10131B] p-8 rounded-2xl text-center border border-dashed border-[#1E2436] text-slate-400 text-xs">
          Nenhum jogador encontrado com os filtros selecionados.
        </div>
      )}

      {/* Individual Player Comanda Modal */}
      {selectedPlayerForComanda && (
        <PlayerComandaModal
          game={game}
          player={game.players.find(p => p.id === selectedPlayerForComanda.id) || selectedPlayerForComanda}
          isOpen={true}
          onClose={() => setSelectedPlayerForComanda(null)}
        />
      )}

      {/* Bulk Expense Modal (e.g. Churrasco R$ 30) */}
      {isBulkExpenseModalOpen && (
        <BulkExpenseModal
          game={game}
          isOpen={isBulkExpenseModalOpen}
          onClose={() => setIsBulkExpenseModalOpen(false)}
        />
      )}

      {/* Game Closing Modal */}
      {isClosingModalOpen && (
        <GameClosingModal
          game={game}
          isOpen={isClosingModalOpen}
          onClose={() => setIsClosingModalOpen(false)}
        />
      )}

      {/* Edit Game Modal */}
      {isEditGameModalOpen && (
        <GameFormModal
          isOpen={isEditGameModalOpen}
          gameToEdit={game}
          onClose={() => setIsEditGameModalOpen(false)}
          onSaved={() => setIsEditGameModalOpen(false)}
        />
      )}
    </div>
  );
};
