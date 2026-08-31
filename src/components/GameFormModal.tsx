import React, { useState, useEffect } from 'react';
import { Game } from '../types';
import { store } from '../services/store';
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  AlertCircle,
  Check
} from 'lucide-react';

interface GameFormModalProps {
  isOpen: boolean;
  gameToEdit?: Game | null;
  onClose: () => void;
  onSaved: (gameId: string) => void;
}

export const GameFormModal: React.FC<GameFormModalProps> = ({
  isOpen,
  gameToEdit,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('20:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [courtPrice, setCourtPrice] = useState(200);
  const [notes, setNotes] = useState('');
  const [players, setPlayers] = useState<Array<{ name: string; raw_tag?: string }>>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (gameToEdit) {
      setTitle(gameToEdit.title);
      setDate(gameToEdit.date);
      setStartTime(gameToEdit.start_time);
      setDurationMinutes(gameToEdit.duration_minutes || 60);
      setCourtPrice(gameToEdit.court_price);
      setNotes(gameToEdit.notes || '');
      setPlayers(gameToEdit.players.map(p => ({ name: p.name, raw_tag: p.raw_tag })));
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTitle('');
      setDate(today);
      setStartTime('20:00');
      setDurationMinutes(60);
      setCourtPrice(200);
      setNotes('');
      setPlayers([]);
    }
  }, [gameToEdit, isOpen]);

  // Conflict validation on single court
  useEffect(() => {
    if (date && startTime) {
      const conflict = store.checkCourtConflict(date, startTime, durationMinutes, gameToEdit?.id);
      if (conflict) {
        setConflictWarning(`Conflito: Já existe o jogo "${conflict.title}" agendado para ${conflict.start_time} às ${conflict.end_time || ''}. A Arena Romano possui apenas 1 quadra.`);
      } else {
        setConflictWarning(null);
      }
    }
  }, [date, startTime, durationMinutes, gameToEdit]);

  if (!isOpen) return null;

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, { name: newPlayerName.trim() }]);
      setNewPlayerName('');
    }
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers(players.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Informe o nome do jogo');
      return;
    }

    if (gameToEdit) {
      try {
        store.updateGame(gameToEdit.id, {
          title: title.trim(),
          date,
          start_time: startTime,
          duration_minutes: durationMinutes,
          court_price: courtPrice,
          notes: notes.trim(),
        });
        onSaved(gameToEdit.id);
        onClose();
      } catch (err: any) {
        alert(err.message || 'Erro ao atualizar jogo');
      }
    } else {
      const res = store.createGame({
        title: title.trim(),
        date,
        start_time: startTime,
        duration_minutes: durationMinutes,
        court_price: courtPrice,
        notes: notes.trim(),
        players,
      });

      if (res.error) {
        alert(res.error);
        return;
      }

      onSaved(res.game.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-xl bg-[#111116] rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#272736] overflow-hidden max-h-[94vh] sm:max-h-[92vh] flex flex-col text-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden w-12 h-1 bg-slate-700/60 rounded-full mx-auto mt-2 mb-1" />

        {/* Header */}
        <div className="bg-[#161622] text-white px-4 sm:px-5 py-3 flex items-center justify-between border-b border-[#262638]">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
            {gameToEdit ? 'Editar Jogo' : 'Cadastrar Novo Jogo'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active-press"
          >
            <X size={19} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1 touch-pan-y">
          {conflictWarning && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Atenção:</span> {conflictWarning}
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Nome do Jogo / Treino *</label>
            <input
              type="text"
              required
              placeholder="Ex: Pelada da Terça, Treino Sub-20"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[#262638] bg-[#0c0c11] text-white placeholder:text-slate-500 focus:border-[#f27d26] outline-none min-h-[42px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-orange-400" /> Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#262638] bg-[#0c0c11] text-white focus:border-[#f27d26] outline-none font-medium min-h-[40px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1 flex items-center gap-1">
                <Clock size={13} className="text-orange-400" /> Horário Início
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#262638] bg-[#0c0c11] text-white focus:border-[#f27d26] outline-none font-medium min-h-[40px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1 flex items-center gap-1">
                <Clock size={13} className="text-orange-400" /> Duração
              </label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#262638] focus:border-[#f27d26] outline-none font-medium bg-[#0c0c11] text-white min-h-[40px]"
              >
                <option value={60}>60 minutos (1h)</option>
                <option value={90}>90 minutos (1h30)</option>
                <option value={120}>120 minutos (2h)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1 flex items-center gap-1">
                <DollarSign size={13} className="text-orange-400" /> Valor da Quadra
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">R$</span>
                <input
                  type="number"
                  step="10"
                  required
                  value={courtPrice}
                  onChange={e => setCourtPrice(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm font-bold text-[#f27d26] rounded-xl border border-[#262638] bg-[#0c0c11] focus:border-[#f27d26] outline-none min-h-[40px]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Observações / Recados</label>
              <input
                type="text"
                placeholder="Ex: Aniversário, levar colete..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#262638] bg-[#0c0c11] text-white placeholder:text-slate-500 focus:border-[#f27d26] outline-none min-h-[40px]"
              />
            </div>
          </div>

          {!gameToEdit && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Users size={13} className="text-orange-400" /> Jogadores Iniciais ({players.length})
                </label>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nome do jogador..."
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPlayer();
                    }
                  }}
                  className="text-xs px-3.5 py-2 rounded-xl border border-[#262638] bg-[#0c0c11] text-white placeholder:text-slate-500 focus:border-[#f27d26] outline-none flex-1 min-h-[38px]"
                />
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="px-3.5 py-2 rounded-xl bg-[#1c1c28] hover:bg-[#28283a] text-slate-200 border border-[#2e2e42] text-xs font-bold flex items-center gap-1 cursor-pointer active-press min-h-[38px]"
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>

              <div className="max-h-32 overflow-y-auto border border-[#22222c] rounded-xl p-1.5 bg-[#0c0c11] space-y-1">
                {players.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-[#161622] rounded-lg border border-[#262638] text-xs">
                    <span className="font-medium text-white">{idx + 1}. {p.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(idx)}
                      className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer active-press"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {players.length === 0 && (
                  <p className="text-center text-[11px] text-slate-500 py-2">Nenhum jogador adicionado ainda.</p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-[#262638] flex items-center justify-end gap-2 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white font-semibold text-xs hover:bg-[#1c1c28] transition-colors cursor-pointer border border-[#262638] min-h-[42px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all active-press cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-initial min-h-[42px]"
            >
              <Check size={16} />
              <span>{gameToEdit ? 'Salvar Alterações' : 'Criar Jogo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
