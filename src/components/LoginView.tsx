import React, { useState, useEffect } from 'react';
import { ArenaLogo } from './ArenaLogo';
import { authService } from '../services/auth';
import { User } from '../types';
import { 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  Database
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Login states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // DB status check
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string; tablesCount?: number } | null>(null);

  useEffect(() => {
    // Check DB status on mount
    authService.fetchDbStatus().then((res) => {
      setDbStatus({
        connected: res.connected ?? false,
        message: res.message || (res.connected ? 'Banco MySQL Conectado' : 'Modo Seguro em Memória'),
        tablesCount: res.tables ? res.tables.length : undefined,
      });
    }).catch(() => {
      setDbStatus({ connected: false, message: 'Operando localmente' });
    });
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = await authService.login(usernameOrEmail, password);
    setIsLoading(false);

    if (res.ok && res.user) {
      setSuccessMsg(`Bem-vindo, ${res.user.name}!`);
      setTimeout(() => {
        onLoginSuccess(res.user!);
      }, 350);
    } else {
      setErrorMsg(res.error || 'Credenciais inválidas. Verifique o usuário e senha.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#08080b] flex flex-col justify-between text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-radial from-orange-500/10 via-transparent to-transparent pointer-events-none blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-radial from-amber-600/5 via-transparent to-transparent pointer-events-none blur-3xl" />

      {/* Main Login Card Container - Centered without Top Header */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-[#101017] rounded-3xl border border-[#232336] shadow-2xl shadow-black/80 overflow-hidden">
          
          {/* Card Header Banner with Arena Branding */}
          <div className="p-6 sm:p-8 text-center border-b border-[#1c1c2b] bg-gradient-to-b from-[#161624] to-[#101017] flex flex-col items-center">
            <div className="mb-3">
              <ArenaLogo size="lg" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Área de Acesso Seguro
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Gestão de Quadras, Jogos e Comandas Digitais
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 space-y-4">
            {/* Feedback Notifications */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{successMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                  Usuário ou E-mail
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Usuário ou e-mail"
                    value={usernameOrEmail}
                    onChange={e => setUsernameOrEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-[#252538] bg-[#0c0c12] text-white placeholder:text-slate-600 focus:border-[#f27d26] outline-none transition-colors min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-[#252538] bg-[#0c0c12] text-white placeholder:text-slate-600 focus:border-[#f27d26] outline-none transition-colors min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#f27d26] hover:bg-[#ff8a3d] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active-press min-h-[46px] mt-2"
              >
                <LogIn size={17} />
                <span>{isLoading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
              </button>
            </form>
          </div>

          {/* Bottom Card Footer: Middleware & DB Info */}
          <div className="px-6 py-3.5 bg-[#0b0b10] border-t border-[#1b1b28] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <Database size={13} className={dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="truncate">
                {dbStatus ? dbStatus.message : 'Verificando banco...'}
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-mono text-slate-500 bg-[#161622] px-2 py-0.5 rounded border border-[#232334]">
              Logs Ativos
            </span>
          </div>

        </div>
      </main>

      {/* Footer System Status */}
      <footer className="relative z-10 w-full py-3 px-4 text-center text-xs text-slate-400 border-t border-[#181822] bg-[#07070a]">
        Arena Romano • Autenticação protegida por Middleware de Auditoria e Sessão
      </footer>
    </div>
  );
};
