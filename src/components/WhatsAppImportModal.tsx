import React, { useState, useEffect } from 'react';
import { parseWhatsAppText } from '../utils/whatsappParser';
import { store } from '../services/store';
import { 
  MessageSquareShare, 
  Check, 
  Trash2, 
  Plus, 
  AlertCircle, 
  X, 
  Calendar,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';

interface WhatsAppImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameCreated: (gameId: string) => void;
}

export const WhatsAppImportModal: React.FC<WhatsAppImportModalProps> = ({
  isOpen,
  onClose,
  onGameCreated,
}) => {
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00');
  const [courtPrice, setCourtPrice] = useState(200);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [players, setPlayers] = useState<Array<{ id: string; name: string; raw_tag?: string; selected: boolean }>>([]);
  const [newPlayerInput, setNewPlayerInput] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Auto-parse when raw text changes
  useEffect(() => {
    if (rawText.trim()) {
      const parsed = parseWhatsAppText(rawText);
      setTitle(parsed.title);
      setDate(parsed.date);
      setTime(parsed.time);
      setCourtPrice(parsed.court_price);
      setPlayers(
        parsed.players.map((p, idx) => ({
          id: `tmp-${idx}-${Date.now()}`,
          name: p.name,
          raw_tag: p.raw_tag,
          selected: true,
        }))
      );
    }
  }, [rawText]);

  // Check single court conflict
  useEffect(() => {
    if (date && time) {
      const conflict = store.checkCourtConflict(date, time, durationMinutes);
      if (conflict) {
        setConflictWarning(`Atenção: Já existe o jogo "${conflict.title}" agendado para ${conflict.start_time} às ${conflict.end_time || ''} nesta data. A Arena Romano possui apenas 1 quadra.`);
      } else {
        setConflictWarning(null);
      }
    }
  }, [date, time, durationMinutes]);

  if (!isOpen) return null;

  const handleAddManualPlayer = () => {
    if (newPlayerInput.trim()) {
      setPlayers([
        ...players,
        {
          id: `tmp-man-${Date.now()}`,
          name: newPlayerInput.trim(),
          selected: true,
        },
      ]);
      setNewPlayerInput('');
    }
  };

  const handleTogglePlayer = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleUpdatePlayerName = (id: string, newName: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const handleConfirmImport = () => {
    if (!title.trim()) {
      alert('Informe o nome do jogo');
      return;
    }
    const selectedPlayers = players.filter(p => p.selected && p.name.trim().length > 0);

    const result = store.createGame({
      title: title.trim(),
      date,
      start_time: time,
      duration_minutes: durationMinutes,
      court_price: courtPrice,
      notes: `Importado via WhatsApp (${selectedPlayers.length} jogadores)`,
      players: selectedPlayers.map(p => ({
        name: p.name.trim(),
        raw_tag: p.raw_tag,
      })),
    });

    if (result.error) {
      alert(result.error);
      return;
    }

    onClose();
    onGameCreated(result.game.id);
  };

  const selectedCount = players.filter(p => p.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-2xl bg-[#111116] rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#272736] overflow-hidden max-h-[94vh] sm:max-h-[92vh] flex flex-col text-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden w-12 h-1 bg-slate-700/60 rounded-full mx-auto mt-2 mb-1" />

        {/* Header */}
        <div className="bg-[#161622] text-white px-4 sm:px-5 py-3 flex items-center justify-between border-b border-[#262638]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#25D366] text-white shadow-md shadow-emerald-500/20 shrink-0">
              <MessageSquareShare size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">Importar Lista WhatsApp</h2>
              <p className="text-[11px] text-slate-400">Cole a mensagem do grupo da Arena Romano</p>
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
          {/* Step 1: Input Textarea */}
          <div>
            <div className="mb-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Cole a mensagem copiada do WhatsApp:
              </label>
            </div>

            <textarea
              rows={3}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Cole aqui a mensagem com a lista de jogadores..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-[#262638] focus:border-[#f27d26] bg-[#0c0c11] text-white placeholder:text-slate-500 transition-all outline-none"
            />
          </div>

          {/* Step 2: Parsed Preview & Adjustments */}
          {rawText.trim().length > 0 && (
            <div className="space-y-3.5 pt-3 border-t border-[#262638]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <Check size={15} className="text-emerald-400" />
                  Prévia Detectada
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30">
                  {selectedCount} jogadores
                </span>
              </div>

              {/* Game Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Nome do Jogo / Treino</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#262638] bg-[#0c0c11] text-white focus:border-[#f27d26] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1 flex items-center gap-1">
                    <Calendar size={13} className="text-orange-400" /> Data
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#262638] bg-[#0c0c11] text-white focus:border-[#f27d26] outline-none font-medium min-h-[38px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1 flex items-center gap-1">
                    <Clock size={13} className="text-orange-400" /> Horário
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#262638] bg-[#0c0c11] text-white focus:border-[#f27d26] outline-none font-medium min-h-[38px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1 flex items-center gap-1">
                    <DollarSign size={13} className="text-orange-400" /> Valor da Quadra
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="10"
                      value={courtPrice}
                      onChange={e => setCourtPrice(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#262638] bg-[#0c0c11] focus:border-[#f27d26] outline-none font-bold text-[#f27d26] min-h-[38px]"
                    />
                  </div>
                </div>
              </div>

              {/* Single Court Conflict Alert */}
              {conflictWarning && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Aviso de Horário:</span> {conflictWarning}
                  </div>
                </div>
              )}

              {/* Players List with Quick Toggles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Users size={14} className="text-orange-400" /> Jogadores Confirmados ({selectedCount})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = players.every(p => p.selected);
                      setPlayers(players.map(p => ({ ...p, selected: !allSelected })));
                    }}
                    className="text-xs text-orange-400 hover:underline font-bold cursor-pointer active-press"
                  >
                    {players.every(p => p.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto border border-[#22222c] rounded-xl p-1.5 bg-[#0c0c11] space-y-1.5">
                  {players.map((player, idx) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl transition-colors border min-h-[40px] ${
                        player.selected ? 'bg-[#161622] border-[#262638] shadow-sm' : 'bg-[#0c0c11] border-transparent opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={player.selected}
                          onChange={() => handleTogglePlayer(player.id)}
                          className="h-4 w-4 rounded accent-[#f27d26] cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-orange-400/80 w-5 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={player.name}
                          onChange={e => handleUpdatePlayerName(player.id, e.target.value)}
                          className="text-xs font-semibold text-white bg-transparent border-b border-transparent focus:border-[#35354a] focus:bg-[#161622] px-1.5 py-0.5 rounded outline-none flex-1"
                        />
                        {player.raw_tag && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[10px] font-bold shrink-0">
                            {player.raw_tag}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(player.id)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer active-press"
                        title="Remover da lista"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}

                  {players.length === 0 && (
                    <p className="text-center text-xs text-slate-500 py-4">Nenhum jogador na lista.</p>
                  )}
                </div>

                {/* Add Extra Player input */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Adicionar outro jogador..."
                    value={newPlayerInput}
                    onChange={e => setNewPlayerInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualPlayer();
                      }
                    }}
                    className="text-xs px-3.5 py-2 rounded-xl border border-[#262638] bg-[#0c0c11] text-white placeholder:text-slate-500 focus:border-[#f27d26] outline-none flex-1 min-h-[38px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualPlayer}
                    className="px-3.5 py-2 rounded-xl bg-[#1c1c28] hover:bg-[#28283a] text-slate-200 border border-[#2e2e42] text-xs font-bold flex items-center gap-1 cursor-pointer active-press min-h-[38px]"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#161622] px-4 sm:px-5 py-3 border-t border-[#262638] flex items-center justify-end gap-2 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white font-semibold text-xs hover:bg-[#1c1c28] transition-colors cursor-pointer border border-[#262638] min-h-[42px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!title.trim() || selectedCount === 0}
            className="px-4 py-2.5 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all active-press disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-initial min-h-[42px]"
          >
            <Check size={16} />
            <span>Importar ({selectedCount} Jogadores)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
