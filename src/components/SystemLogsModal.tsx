import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { 
  X, 
  RefreshCw, 
  Terminal, 
  Database, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  Layers,
  Clock
} from 'lucide-react';

interface SystemLogsModalProps {
  onClose: () => void;
}

export const SystemLogsModal: React.FC<SystemLogsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'database' | 'users'>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, statusData] = await Promise.all([
        authService.fetchServerLogs(),
        authService.fetchDbStatus(),
      ]);
      setLogs(logsData);
      setDbStatus(statusData);

      // Try fetching users
      try {
        const res = await fetch('/api/auth/users', {
          headers: authService.getAuthHeaders(),
        });
        if (res.ok) {
          const u = await res.json();
          setUsers(u.users || []);
        }
      } catch {
        // Silently catch
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerDbInit = async () => {
    setIsLoading(true);
    setActionMsg(null);
    try {
      const res = await authService.triggerDbInit();
      if (res.ok) {
        setActionMsg('✅ Verificação e criação de tabelas executadas com sucesso!');
        await loadData();
      } else {
        setActionMsg(`⚠️ ${res.error || 'Não foi possível conectar ao MySQL.'}`);
      }
    } catch (e: any) {
      setActionMsg(`❌ Erro: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-3xl bg-[#101016] rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#262638] overflow-hidden max-h-[94vh] sm:max-h-[90vh] flex flex-col text-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1 bg-slate-700/60 rounded-full mx-auto mt-2 mb-1" />

        {/* Modal Header */}
        <div className="bg-[#151520] text-white px-4 sm:px-5 py-3 flex items-center justify-between border-b border-[#232334]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-500/15 text-[#f27d26]">
              <Terminal size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Auditoria de Logs & Banco de Dados
              </h2>
              <p className="text-[11px] text-slate-400">
                Monitoramento do Middleware HTTP e Tabelas MySQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Atualizar"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-2 bg-[#0c0c12] border-b border-[#1f1f2e] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-[#f27d26] text-white'
                : 'text-slate-400 hover:text-white bg-[#151520]'
            }`}
          >
            <Activity size={13} />
            <span>Logs do Middleware ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'bg-[#f27d26] text-white'
                : 'text-slate-400 hover:text-white bg-[#151520]'
            }`}
          >
            <Database size={13} />
            <span>Tabelas MySQL</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-[#f27d26] text-white'
                : 'text-slate-400 hover:text-white bg-[#151520]'
            }`}
          >
            <Users size={13} />
            <span>Usuários ({users.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 touch-pan-y space-y-3">
          {actionMsg && (
            <div className="p-3 rounded-xl bg-[#171724] border border-[#2b2b40] text-xs text-slate-200">
              {actionMsg}
            </div>
          )}

          {/* TAB 1: HTTP REQUEST LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Últimas requisições interceptadas pelo Middleware:</span>
                <span className="text-[10px] font-mono text-slate-500">Auto-refresh a cada 5s</span>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center bg-[#0d0d14] rounded-xl border border-[#1f1f2e] text-slate-500 text-xs">
                  Nenhuma requisição registrada ainda.
                </div>
              ) : (
                <div className="bg-[#0b0b10] rounded-xl border border-[#1e1e2d] overflow-hidden font-mono text-[11px]">
                  <div className="divide-y divide-[#181824] max-h-[55vh] overflow-y-auto">
                    {logs.map((log, idx) => {
                      const isOk = log.status_code >= 200 && log.status_code < 400;
                      return (
                        <div key={log.id || idx} className="p-2.5 hover:bg-[#12121c] flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              log.method === 'POST' ? 'bg-indigo-500/20 text-indigo-300' :
                              log.method === 'GET' ? 'bg-emerald-500/20 text-emerald-300' :
                              'bg-amber-500/20 text-amber-300'
                            }`}>
                              {log.method}
                            </span>
                            <span className="text-white font-medium break-all">{log.url}</span>
                            <span className="text-slate-500 text-[10px]">por {log.user_identifier || 'visitante'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              isOk ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {log.status_code}
                            </span>
                            <span className="text-slate-400 text-[10px]">{log.duration_ms}ms</span>
                            <span className="text-slate-500 text-[10px]">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MYSQL TABLES & VERIFICATION */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#14141e] border border-[#222232] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Database size={18} className={dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'} />
                    <div>
                      <h4 className="text-xs font-bold text-white">Status da Conexão MySQL</h4>
                      <p className="text-[11px] text-slate-400">
                        {dbStatus?.connected 
                          ? `Conectado ao banco: ${dbStatus.database || 'arena_romano'}` 
                          : 'Operando em modo de memória seguro com sincronização local'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerDbInit}
                    disabled={isLoading}
                    className="px-3.5 py-2 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] text-white text-xs font-bold cursor-pointer transition-all active-press flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                    <span>Reverificar / Criar Tabelas</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers size={14} className="text-orange-400" />
                  Tabelas Obrigatórias do Sistema
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { name: 'users', desc: 'Tabela de usuários, logins e permissões' },
                    { name: 'products', desc: 'Produtos do bar e faixas progressivas' },
                    { name: 'court_schedules', desc: 'Horários fixos da quadra e valores' },
                    { name: 'games', desc: 'Partidas e agendamentos' },
                    { name: 'game_players', desc: 'Jogadores e comandas individuais' },
                    { name: 'consumptions', desc: 'Itens consumidos em tempo real' },
                    { name: 'daily_closings', desc: 'Fechamentos diários e auditoria' },
                    { name: 'system_logs', desc: 'Auditoria de requisições HTTP' },
                  ].map((tbl) => {
                    const isPresentInDb = dbStatus?.tables && Array.isArray(dbStatus.tables) 
                      ? dbStatus.tables.includes(tbl.name) 
                      : false;

                    return (
                      <div key={tbl.name} className="p-3 bg-[#0d0d14] rounded-xl border border-[#1f1f2e] flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-white block">{tbl.name}</span>
                          <span className="text-[10px] text-slate-400">{tbl.desc}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          isPresentInDb
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {isPresentInDb ? 'Criada no MySQL' : 'Ativa no Sistema'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REGISTERED USERS */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Usuários com acesso ao sistema:
              </div>

              <div className="divide-y divide-[#1e1e2d] bg-[#0c0c12] rounded-xl border border-[#202030] overflow-hidden">
                {users.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Carregando lista de usuários...
                  </div>
                ) : (
                  users.map((u) => (
                    <div key={u.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1b1b28] border border-[#29293e] flex items-center justify-center font-bold text-orange-400 text-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">{u.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin' 
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {u.role}
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Ativo
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#13131c] border-t border-[#202030] flex items-center justify-end pb-safe">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#20202e] hover:bg-[#2a2a3e] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
