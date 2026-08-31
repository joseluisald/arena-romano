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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-24 sm:pb-12 text-slate-100">
      
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121218] p-3.5 sm:p-4 rounded-2xl border border-[#20202c]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Horários & Tarifas da Quadra
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Grade de horários, regras de pico e prevenção de conflitos.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white text-xs font-bold shadow-sm active-press cursor-pointer self-start sm:self-auto transition-all"
        >
          <Plus size={14} />
          <span>Novo Horário Padrão</span>
        </button>
      </div>

      {/* Single Court Rule Card */}
      <div className="bg-gradient-to-r from-[#161622] via-[#12121a] to-[#0f0f15] text-white p-4 rounded-2xl border border-[#262638] shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#1c1c2b] text-orange-400 border border-[#2e2e42]">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Arena Romano possui 1 Quadra Esportiva</h3>
            <p className="text-xs text-slate-400">
              O sistema monitora e bloqueia automaticamente qualquer sobreposição de jogos ou agendamentos na mesma data e horário.
            </p>
          </div>
        </div>
      </div>

      {/* Default Schedule Slots Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-200">Grades Horárias Padrão & Valores</h2>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-[#111116] rounded-2xl p-8 border border-[#20202c] text-center max-w-md mx-auto my-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1a1a24] text-orange-400 flex items-center justify-center mx-auto border border-[#2a2a38]">
              <Clock size={24} />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum horário padrão cadastrado</h3>
            <p className="text-xs text-slate-400">
              Cadastre as grades horárias e valores padrão da quadra para agilizar novos agendamentos.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Cadastrar Novo Horário</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {schedules.map(slot => (
              <div
                key={slot.id}
                className={`bg-[#111116] rounded-2xl p-4 border transition-all hover:border-[#353545] flex flex-col justify-between ${
                  slot.is_blocked ? 'border-[#22222c]/60 bg-[#0d0d12]/80 opacity-60' : 'border-[#22222c] shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-lg sm:text-xl text-[#f27d26]">
                      {slot.time}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#161620] text-slate-400 border border-[#262633]">
                      {slot.duration_minutes} min
                    </span>
                  </div>

                  {slot.label && (
                    <span className="text-[11px] font-bold text-orange-400 block mb-2">
                      {slot.label}
                    </span>
                  )}

                  <div className="my-2 p-2 rounded-xl bg-[#0c0c11] border border-[#22222c]">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor da Quadra</span>
                    <span className="text-base font-black text-white">
                      {formatCurrency(slot.default_price)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#22222c] flex items-center justify-between">
                  <span className={`text-[11px] font-medium ${slot.is_blocked ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {slot.is_blocked ? 'Bloqueado' : 'Disponível'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(slot)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1c1c27] border border-transparent hover:border-[#262638] cursor-pointer"
                      title="Editar horário"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/20 border border-transparent hover:border-[#262638] cursor-pointer"
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

      {/* Date Occupancy Visualizer */}
      <div className="bg-[#111116] rounded-2xl p-4 sm:p-5 border border-[#22222c] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Ocupação da Quadra por Data</h3>
            <p className="text-xs text-slate-400">Visualize os jogos agendados para verificar a disponibilidade da quadra.</p>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs sm:text-sm font-semibold text-white bg-[#0c0c11] px-3 py-1.5 rounded-xl border border-[#262638] focus:border-[#f27d26] outline-none"
          />
        </div>

        <div className="space-y-2">
          {gamesOnSelectedDate.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 bg-[#0c0c11] rounded-xl border border-dashed border-[#22222c]">
              Nenhum jogo cadastrado nesta data. A quadra está totalmente livre!
            </div>
          ) : (
            gamesOnSelectedDate.map(game => (
              <div
                key={game.id}
                className="p-3 bg-[#0c0c11] rounded-xl border border-[#22222c] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-[#f27d26] bg-[#161622] px-2.5 py-1 rounded-lg border border-[#262638]">
                    {game.start_time} - {game.end_time}
                  </span>
                  <div>
                    <span className="font-extrabold text-white block">{game.title}</span>
                    <span className="text-slate-400">{game.players.length} jogadores • {game.status.toUpperCase()}</span>
                  </div>
                </div>

                <span className="font-extrabold text-white">
                  {formatCurrency(game.court_price)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#111116] rounded-2xl shadow-2xl border border-[#272736] overflow-hidden my-auto text-slate-100">
            <div className="bg-[#161622] text-white px-5 py-4 flex items-center justify-between border-b border-[#262638]">
              <h2 className="text-base font-bold text-white">
                {editingSlot ? 'Editar Horário Padrão' : 'Novo Horário Padrão'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Horário Início *</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#272736] bg-[#0c0c11] text-white focus:border-[#f27d26] outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Duração *</label>
                  <select
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#272736] bg-[#0c0c11] text-white focus:border-[#f27d26] outline-none font-medium"
                  >
                    <option value={60}>60 minutos (1h)</option>
                    <option value={90}>90 minutos (1h30)</option>
                    <option value={120}>120 minutos (2h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Valor Padrão da Quadra (R$) *</label>
                <input
                  type="number"
                  step="10"
                  required
                  value={defaultPrice}
                  onChange={e => setDefaultPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#272736] bg-[#0c0c11] focus:border-[#f27d26] outline-none font-bold text-[#f27d26]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Rótulo / Identificação</label>
                <input
                  type="text"
                  placeholder="Ex: Horário Nobre, Happy Hour..."
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#272736] bg-[#0c0c11] text-white placeholder:text-slate-500 focus:border-[#f27d26] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isBlockedCheck"
                  checked={isBlocked}
                  onChange={e => setIsBlocked(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#f27d26] cursor-pointer"
                />
                <label htmlFor="isBlockedCheck" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Bloquear este horário para manutenção / uso interno
                </label>
              </div>

              <div className="pt-3 border-t border-[#22222c] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white font-semibold text-xs border border-[#272736] hover:bg-[#1c1c27] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white font-bold text-xs shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
