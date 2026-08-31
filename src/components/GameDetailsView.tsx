import React, { useState } from 'react';
import { Game, GamePlayer, GameStatus, PaymentMethod } from '../types';
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
  List
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

  // Edit player name inline
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-slate-400 mb-4">Jogo não encontrado ou excluído.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#f27d26] text-white rounded-xl font-bold text-xs cursor-pointer"
        >
          Voltar
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

  const handleSaveEditedPlayerName = (playerId: string) => {
    if (editingPlayerName.trim()) {
      store.updatePlayerName(game.id, playerId, editingPlayerName.trim());
      setEditingPlayerId(null);
    }
  };

  const handleDeleteGame = () => {
    if (confirm(`Deseja realmente excluir o jogo "${game.title}"? Todos os consumos associados serão apagados.`)) {
      store.deleteGame(game.id);
      onBack();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-24 sm:pb-12 text-slate-100">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer bg-[#121218] hover:bg-[#181822] px-3 py-1.5 rounded-xl border border-[#22222f]"
        >
          <ChevronLeft size={15} />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Lançar Churrasco / Rateio Geral Button */}
          <button
            onClick={() => setIsBulkExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-xs font-bold transition-all cursor-pointer"
            title="Lançar churrasco ou rateio para todos"
          >
            <UtensilsCrossed size={14} />
            <span className="hidden sm:inline">Rateio Churrasco</span>
            <span className="sm:hidden">Churrasco</span>
          </button>

          {/* Fechamento do Jogo */}
          <button
            onClick={() => setIsClosingModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Flag size={14} />
            <span>Fechamento</span>
          </button>

          <button
            onClick={() => setIsEditGameModalOpen(true)}
            className="p-1.5 rounded-xl bg-[#121218] hover:bg-[#181822] text-slate-400 hover:text-slate-200 border border-[#22222f] transition-colors cursor-pointer"
            title="Editar informações do jogo"
          >
            <Edit3 size={15} />
          </button>

          <button
            onClick={handleDeleteGame}
            className="p-1.5 rounded-xl bg-[#121218] hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-[#22222f] transition-colors cursor-pointer"
            title="Excluir jogo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Clean Game Summary Header */}
      <div className="bg-[#121218] text-white rounded-2xl p-4 border border-[#20202c] shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold bg-[#0c0c11] px-2 py-0.5 rounded text-orange-400 border border-[#20202c]">
                {game.start_time} - {game.end_time}
              </span>
              <span className="text-xs text-slate-400">
                {game.date.split('-').reverse().join('/')}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {game.title}
            </h1>
            {game.notes && (
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                {game.notes}
              </p>
            )}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Status:</span>
            <select
              value={game.status}
              onChange={e => handleStatusChange(e.target.value as GameStatus)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer border ${
                game.status === 'em_andamento'
                  ? 'bg-[#f27d26] text-white border-orange-500'
                  : game.status === 'finalizado'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-[#181822] text-slate-200 border-[#28283a]'
              }`}
            >
              <option value="agendado">Agendado</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        {/* Compact KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1e1e28] text-xs">
          <div className="bg-[#0b0b10] p-2 rounded-xl border border-[#1e1e28]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Jogadores</span>
            <span className="text-sm sm:text-base font-bold text-white">
              {presentCount} / {game.players.length} presentes
            </span>
          </div>

          <div className="bg-[#0b0b10] p-2 rounded-xl border border-[#1e1e28]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consumo no Bar</span>
            <span className="text-sm sm:text-base font-extrabold text-[#f27d26]">
              {formatCurrency(totalConsumption)}
            </span>
          </div>

          <div className="bg-[#0b0b10] p-2 rounded-xl border border-[#1e1e28]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Quadra</span>
            <span className="text-sm sm:text-base font-bold text-white">
              {formatCurrency(game.court_price)}
            </span>
          </div>

          <div className="bg-[#0b0b10] p-2 rounded-xl border border-[#1e1e28]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Geral</span>
            <span className="text-sm sm:text-base font-black text-emerald-400">
              {formatCurrency(totalGrand)}
            </span>
          </div>
        </div>
      </div>

      {/* Roster Controls: Search, Filters & Action Buttons */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar jogador..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#20202c] bg-[#121218] text-white placeholder:text-slate-500 focus:border-[#f27d26] outline-none"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleMarkAllPresent}
              className="px-2.5 py-1.5 rounded-xl bg-[#121218] hover:bg-[#181822] text-slate-300 font-semibold text-xs flex items-center gap-1 border border-[#20202c] cursor-pointer"
            >
              <UserCheck size={13} className="text-emerald-400" />
              <span>Todos Presentes</span>
            </button>

            <button
              onClick={() => setIsAddingPlayer(!isAddingPlayer)}
              className="px-3 py-1.5 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Plus size={13} />
              <span>+ Jogador</span>
            </button>

            {/* Layout Toggle */}
            <div className="hidden sm:flex items-center border border-[#20202c] rounded-xl bg-[#121218] p-0.5">
              <button
                onClick={() => setViewLayout('cards')}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${viewLayout === 'cards' ? 'bg-[#20202c] text-white' : 'text-slate-500 hover:text-slate-300'}`}
                title="Visualização em Cards"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewLayout('table')}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${viewLayout === 'table' ? 'bg-[#20202c] text-white' : 'text-slate-500 hover:text-slate-300'}`}
                title="Visualização em Lista"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Inline Add Player */}
        {isAddingPlayer && (
          <div className="p-2.5 bg-[#161622] border border-orange-500/40 rounded-xl flex items-center gap-2">
            <input
              type="text"
              placeholder="Nome do jogador..."
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddPlayer();
              }}
              autoFocus
              className="px-3 py-1 text-xs bg-[#0c0c11] text-white rounded-lg border border-[#262638] focus:border-[#f27d26] outline-none flex-1 font-semibold"
            />
            <button
              onClick={handleAddPlayer}
              className="px-3 py-1 bg-[#f27d26] text-white text-xs font-bold rounded-lg hover:bg-[#ff8a3d] cursor-pointer"
            >
              Adicionar
            </button>
            <button
              onClick={() => setIsAddingPlayer(false)}
              className="px-2.5 py-1 bg-[#20202e] text-slate-300 text-xs rounded-lg hover:bg-[#28283a] cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
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
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterMode === f.id
                  ? 'bg-[#f27d26] text-white shadow-xs'
                  : 'bg-[#121218] text-slate-400 hover:text-slate-200 border border-[#20202c]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Players List: Table/List View OR Compact Card Grid */}
      {viewLayout === 'table' ? (
        <div className="bg-[#121218] rounded-2xl border border-[#20202c] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e0e14] text-slate-400 border-b border-[#20202c]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">#</th>
                <th className="py-2.5 px-3 font-semibold">Jogador</th>
                <th className="py-2.5 px-3 font-semibold">Presença</th>
                <th className="py-2.5 px-3 font-semibold">Itens</th>
                <th className="py-2.5 px-3 font-semibold text-right">Consumo</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e28]">
              {filteredPlayers.map((player, idx) => (
                <tr 
                  key={player.id}
                  onClick={() => setSelectedPlayerForComanda(player)}
                  className="hover:bg-[#161622] transition-colors cursor-pointer"
                >
                  <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-2 px-3 font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      <span>{player.name}</span>
                      {player.raw_tag && (
                        <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1 rounded">
                          {player.raw_tag}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={(e) => handleTogglePresence(player.id, e)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        player.is_present
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-[#181822] text-slate-400'
                      }`}
                    >
                      {player.is_present ? 'Presente' : 'Ausente'}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    {player.consumptions.length > 0 ? (
                      <span className="text-[11px] text-slate-300">
                        {player.consumptions.map(c => `${c.quantity}x ${c.product_name.split(' ')[0]}`).join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-[#f27d26] font-mono">
                    {formatCurrency(player.total_consumption)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {player.total_consumption > 0 ? (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        player.is_paid ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                      }`}>
                        {player.is_paid ? 'PAGO' : 'PENDENTE'}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlayerForComanda(player);
                      }}
                      className="px-2.5 py-1 bg-[#f27d26] hover:bg-[#ff8a3d] text-white rounded-lg text-xs font-bold cursor-pointer"
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
        /* Cards View (Clean & Compact) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredPlayers.map((player, idx) => {
            const hasConsumption = player.total_consumption > 0;
            const itemsCount = player.consumptions.reduce((sum, c) => sum + c.quantity, 0);

            return (
              <div
                key={player.id}
                onClick={() => setSelectedPlayerForComanda(player)}
                className={`bg-[#121218] rounded-xl p-3 border transition-all hover:border-[#303042] cursor-pointer flex flex-col justify-between ${
                  hasConsumption
                    ? 'border-[#242434] shadow-sm'
                    : 'border-[#1e1e28] opacity-95'
                }`}
              >
                <div>
                  {/* Player Name + Presence */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[11px] font-mono text-slate-500 font-bold shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-sm text-white truncate">
                        {player.name}
                      </span>
                      {player.raw_tag && (
                        <span className="px-1 py-0.2 rounded bg-orange-500/10 text-orange-300 text-[9px] font-bold shrink-0">
                          {player.raw_tag}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleTogglePresence(player.id, e)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 cursor-pointer ${
                        player.is_present
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-[#181822] text-slate-400 border border-[#242434]'
                      }`}
                    >
                      {player.is_present ? 'Presente' : 'Ausente'}
                    </button>
                  </div>

                  {/* Consumed items snippet */}
                  <div className="py-1.5 px-2 rounded-lg bg-[#0c0c11] border border-[#1e1e28] flex items-center justify-between text-xs my-1">
                    <span className="text-slate-400 text-[11px]">Consumo:</span>
                    <span className={`font-black font-mono ${hasConsumption ? 'text-[#f27d26]' : 'text-slate-500'}`}>
                      {formatCurrency(player.total_consumption)}
                    </span>
                  </div>

                  {/* Items tags */}
                  {player.consumptions.length > 0 && (
                    <div className="flex flex-wrap gap-1 my-1.5">
                      {player.consumptions.map(c => (
                        <span
                          key={c.id}
                          className="text-[9px] bg-[#1a1a26] text-slate-300 px-1.5 py-0.2 rounded border border-[#252538]"
                        >
                          {c.quantity}x {c.product_name.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="pt-2 flex items-center justify-between border-t border-[#1e1e28] mt-1">
                  <div>
                    {hasConsumption && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        player.is_paid
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}>
                        {player.is_paid ? 'PAGO' : 'PENDENTE'}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlayerForComanda(player);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Comanda</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredPlayers.length === 0 && (
        <div className="bg-[#121218] p-6 rounded-2xl text-center border border-dashed border-[#20202c] text-slate-400 text-xs">
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
