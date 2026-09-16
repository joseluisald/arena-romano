import React, { useState } from 'react';
import { CourtScheduleSlot } from '../types';
import { store } from '../services/store';
import { formatCurrency } from '../utils/pricing';
import { 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Shield, 
  DollarSign, 
  Calendar,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';

export const SchedulesView: React.FC = () => {
  const schedules = store.getSchedules();
  const games = store.getGames();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<CourtScheduleSlot | null>(null);
  
  const [time, setTime] = useState('20:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [defaultPrice, setDefaultPrice] = useState(200);
  const [label, setLabel] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const gamesOnSelectedDate = games.filter(g => g.date === selectedDate);

  const handleOpenCreateModal = () => {
    setEditingSlot(null);
    setTime('20:00');
    setDurationMinutes(60);
    setDefaultPrice(200);
    setLabel('');
    setIsBlocked(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot: CourtScheduleSlot) => {
    setEditingSlot(slot);
    setTime(slot.time);
    setDurationMinutes(slot.duration_minutes);
    setDefaultPrice(slot.default_price);
    setLabel(slot.label || '');
    setIsBlocked(slot.is_blocked);
    setIsModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || defaultPrice <= 0) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    store.saveSchedule({
      id: editingSlot?.id,
      time,
      duration_minutes: durationMinutes,
      default_price: defaultPrice,
      label: label.trim(),
      is_blocked: isBlocked,
    });

    setIsModalOpen(false);
  };

  const handleDeleteSlot = (id: string) => {
    if (confirm('Deseja excluir esta grade de horário padrão?')) {
      store.deleteSchedule(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 md:pb-12 text-slate-100">
      
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10131B] p-4 sm:p-5 rounded-2xl border border-[#1E2436] shadow-md shadow-black/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Horários & Tarifas da Quadra
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Defina horários padrão, preços de locação e acompanhe a ocupação da quadra.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6600] hover:bg-[#FF7B1A] text-white text-xs font-bold shadow-md shadow-orange-500/25 active-press cursor-pointer self-start sm:self-auto transition-all"
        >
          <Plus size={15} />
          <span>Novo Horário Padrão</span>
        </button>
      </div>

      {/* Single Court Rule Card */}
      <div className="bg-gradient-to-r from-[#1E1216] via-[#141724] to-[#10131B] text-white p-5 rounded-2xl border border-orange-500/30 shadow-md shadow-black/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#FF6600]/15 text-[#FF6600] border border-[#FF6600]/30 shrink-0">
            <Shield size={26} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">Controle de Quadra Única (Arena Romano)</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              O sistema previne conflitos de reserva e valida sobreposições de partidas no mesmo intervalo de horário.
            </p>
          </div>
        </div>
      </div>

      {/* Default Schedule Slots Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            Grades Horárias Padrão & Preços ({schedules.length})
          </h2>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-[#10131B] rounded-2xl p-10 border border-[#1E2436] text-center max-w-md mx-auto my-4 space-y-3 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-[#181D2B] text-orange-400 flex items-center justify-center mx-auto border border-[#23293D]">
              <Clock size={24} />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum horário padrão cadastrado</h3>
            <p className="text-xs text-slate-400">
              Cadastre as faixas de horário mais comuns para agilizar o lançamento das partidas.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6600] hover:bg-[#FF7B1A] text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Cadastrar Horário</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {schedules.map(slot => (
              <div
                key={slot.id}
                className={`bg-[#10131B] rounded-2xl p-4 border transition-all hover:border-[#2B354F] hover:bg-[#131722] flex flex-col justify-between group ${
                  slot.is_blocked ? 'border-[#1E2436]/60 bg-[#0C0E15]/80 opacity-60' : 'border-[#1E2436] shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-xl text-[#FF6600]">
                      {slot.time}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#181D2B] text-slate-300 border border-[#23293D]">
                      {slot.duration_minutes} min
                    </span>
                  </div>

                  {slot.label && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block mb-2">
                      {slot.label}
                    </span>
                  )}

                  <div className="my-2.5 p-2.5 rounded-xl bg-[#0C0E15] border border-[#1A2030]">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Tarifa Padrão</span>
                    <span className="text-base font-black text-white font-mono">
                      {formatCurrency(slot.default_price)}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#1B2132] flex items-center justify-between mt-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    slot.is_blocked ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {slot.is_blocked ? 'Bloqueado' : 'Liberado'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(slot)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#181D2B] cursor-pointer"
                      title="Editar horário"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/15 cursor-pointer"
                      title="Excluir horário"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#10131B] rounded-3xl shadow-2xl border border-[#1E2436] overflow-hidden text-slate-100">
            <div className="bg-[#141824] px-5 py-4 flex items-center justify-between border-b border-[#1E2436]">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {editingSlot ? 'Editar Horário Padrão' : 'Novo Horário Padrão'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E2538] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Horário Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold bg-[#0C0E15] text-white rounded-xl border border-[#1E2436] focus:border-[#FF6600] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Duração (minutos)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-semibold bg-[#0C0E15] text-white rounded-xl border border-[#1E2436] focus:border-[#FF6600] outline-none"
                  >
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={90}>90 minutos (1h 30m)</option>
                    <option value={120}>120 minutos (2 horas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Preço Base da Quadra (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    required
                    value={defaultPrice}
                    onChange={e => setDefaultPrice(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-base font-black text-[#FF6600] bg-[#0C0E15] rounded-xl border border-[#1E2436] focus:border-[#FF6600] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Rótulo ou Observação (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Horário Nobre / Pico, Mensalista..."
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0C0E15] text-white rounded-xl border border-[#1E2436] focus:border-[#FF6600] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="blockedCheckbox"
                  checked={isBlocked}
                  onChange={e => setIsBlocked(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6600] bg-[#0C0E15] border-[#1E2436] focus:ring-[#FF6600]"
                />
                <label htmlFor="blockedCheckbox" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Bloquear este horário para novos agendamentos
                </label>
              </div>

              <div className="pt-3 border-t border-[#1E2436] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold hover:bg-[#181D2B] border border-[#1E2436]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF6600] hover:bg-[#FF7B1A] text-white text-xs font-bold shadow-md shadow-orange-500/25"
                >
                  Salvar Horário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
