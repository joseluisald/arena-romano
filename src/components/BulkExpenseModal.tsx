import React, { useState } from 'react';
import { Game } from '../types';
import { store } from '../services/store';
import { formatCurrency } from '../utils/pricing';
import { 
  X, 
  UtensilsCrossed, 
  Users, 
  Check, 
  Sparkles,
  DollarSign
} from 'lucide-react';

interface BulkExpenseModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
}

export const BulkExpenseModal: React.FC<BulkExpenseModalProps> = ({
  game,
  isOpen,
  onClose,
}) => {
  const [expenseName, setExpenseName] = useState('Churrasco');
  const [expensePrice, setExpensePrice] = useState<number | string>(30);
  const [splitMode, setSplitMode] = useState<'per_player' | 'total_split'>('per_player');
  const [totalBillAmount, setTotalBillAmount] = useState<number | string>(360);
  
  // Selected players (default to all present players, or all players if none marked present)
  const presentPlayers = game.players.filter(p => p.is_present);
  const initialSelected = (presentPlayers.length > 0 ? presentPlayers : game.players).map(p => p.id);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(initialSelected);

  if (!isOpen) return null;

  const togglePlayer = (id: string) => {
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(selectedPlayerIds.filter(pId => pId !== id));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedPlayerIds(game.players.map(p => p.id));
  };

  const selectPresentOnly = () => {
    const ids = game.players.filter(p => p.is_present).map(p => p.id);
    setSelectedPlayerIds(ids.length > 0 ? ids : game.players.map(p => p.id));
  };

  const pricePerPlayer = splitMode === 'per_player'
    ? (typeof expensePrice === 'string' ? parseFloat(expensePrice.replace(',', '.')) : expensePrice) || 0
    : selectedPlayerIds.length > 0
      ? ((typeof totalBillAmount === 'string' ? parseFloat(totalBillAmount.replace(',', '.')) : totalBillAmount) || 0) / selectedPlayerIds.length
      : 0;

  const grandTotal = pricePerPlayer * selectedPlayerIds.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayerIds.length === 0) {
      alert('Selecione ao menos um jogador para o rateio.');
      return;
    }
    if (pricePerPlayer <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    const name = expenseName.trim() || 'Churrasco';
    store.addBulkCustomConsumption(game.id, selectedPlayerIds, name, Math.round(pricePerPlayer * 100) / 100);
    onClose();
  };

  const quickPresets = [
    { name: 'Churrasco', price: 30 },
    { name: 'Rateio Churrasco', price: 35 },
    { name: 'Carne & Acompanhamentos', price: 40 },
    { name: 'Rateio Gelo & Carvão', price: 10 },
    { name: 'Taxa / Entrada', price: 15 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0e0e13] rounded-2xl shadow-2xl border border-[#22222f] overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="bg-[#14141d] px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-[#20202c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Lançar Churrasco / Rateio Geral
              </h2>
              <p className="text-xs text-slate-400">
                Aplica a despesa nas comandas dos jogadores de uma só vez.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Quick presets */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
              Sugestões Rápidas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setExpenseName(preset.name);
                    setExpensePrice(preset.price);
                    setSplitMode('per_player');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    expenseName === preset.name
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-[#14141d] text-slate-300 border-[#222230] hover:bg-[#1a1a26]'
                  }`}
                >
                  {preset.name} (R$ {preset.price})
                </button>
              ))}
            </div>
          </div>

          {/* Item Name & Mode */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Nome da Despesa:
              </label>
              <input
                type="text"
                value={expenseName}
                onChange={e => setExpenseName(e.target.value)}
                placeholder="Ex: Churrasco, Rateio Carne, Gelo..."
                className="w-full px-3 py-2 text-xs font-semibold bg-[#14141d] text-white rounded-xl border border-[#222230] focus:border-[#f27d26] outline-none"
              />
            </div>

            {/* Split Mode Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSplitMode('per_player')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                  splitMode === 'per_player'
                    ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                    : 'bg-[#14141d] text-slate-400 border-[#222230]'
                }`}
              >
                <span className="block font-black text-white">Valor por Pessoa</span>
                <span className="text-[10px] text-slate-400">Ex: R$ 30,00 cada</span>
              </button>

              <button
                type="button"
                onClick={() => setSplitMode('total_split')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                  splitMode === 'total_split'
                    ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                    : 'bg-[#14141d] text-slate-400 border-[#222230]'
                }`}
              >
                <span className="block font-black text-white">Dividir Conta Total</span>
                <span className="text-[10px] text-slate-400">Ex: R$ 360 divididos</span>
              </button>
            </div>

            {/* Price Input */}
            {splitMode === 'per_player' ? (
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Valor por Jogador (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    value={expensePrice}
                    onChange={e => setExpensePrice(e.target.value)}
                    placeholder="30.00"
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-[#14141d] text-white rounded-xl border border-[#222230] focus:border-[#f27d26] outline-none font-mono"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Valor Total da Conta (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={totalBillAmount}
                    onChange={e => setTotalBillAmount(e.target.value)}
                    placeholder="360.00"
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-[#14141d] text-white rounded-xl border border-[#222230] focus:border-[#f27d26] outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Players Selection */}
          <div className="space-y-2 pt-2 border-t border-[#20202c]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Users size={13} className="text-orange-400" /> Aplicar para ({selectedPlayerIds.length}/{game.players.length})
              </span>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={selectPresentOnly}
                  className="px-2 py-0.5 rounded bg-[#14141d] text-emerald-400 hover:bg-[#1a1a26] text-[11px] font-semibold border border-[#222230]"
                >
                  Só Presentes ({presentPlayers.length})
                </button>
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2 py-0.5 rounded bg-[#14141d] text-slate-300 hover:bg-[#1a1a26] text-[11px] font-semibold border border-[#222230]"
                >
                  Todos ({game.players.length})
                </button>
              </div>
            </div>

            {/* Players checkboxes grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1">
              {game.players.map(player => {
                const isSelected = selectedPlayerIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500/40 text-white'
                        : 'bg-[#14141d] border-[#20202c] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate font-semibold">{player.name}</span>
                    <span className={`h-4 w-4 rounded flex items-center justify-center text-[10px] shrink-0 ml-1 ${
                      isSelected ? 'bg-[#f27d26] text-white' : 'border border-[#2e2e40]'
                    }`}>
                      {isSelected && <Check size={11} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-[#14141d] p-3 rounded-xl border border-[#20202c] flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Resumo do Lançamento</span>
              <span className="text-sm font-bold text-white">
                {formatCurrency(pricePerPlayer)} <span className="text-slate-400 font-normal text-xs">por jogador</span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Geral</span>
              <span className="text-sm font-black text-[#f27d26]">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#14141d] text-slate-300 hover:bg-[#1c1c28] text-xs font-semibold border border-[#222230] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={selectedPlayerIds.length === 0 || pricePerPlayer <= 0}
              className="px-4 py-2 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-orange-500/20 active-press cursor-pointer flex items-center gap-1.5"
            >
              <UtensilsCrossed size={14} />
              <span>Lançar {formatCurrency(pricePerPlayer)} para {selectedPlayerIds.length} jogadores</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
