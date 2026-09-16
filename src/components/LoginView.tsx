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
  Database,
  ShieldCheck
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
        message: res.message || (res.connected ? 'Banco de Dados Conectado' : 'Modo Operacional Local'),
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
      setSuccessMsg(`Bem-vindo, ${res.user.name || res.user.username}!`);
      setTimeout(() => {
        onLoginSuccess(res.user!);
      }, 300);
    } else {
      setErrorMsg(res.error || 'Credenciais incorretas. Verifique seu usuário e senha.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090B10] flex flex-col justify-between text-slate-100 relative overflow-hidden selection:bg-[#FF6600] selection:text-white">
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-[#8E1632]/20 via-[#FF6600]/5 to-transparent pointer-events-none blur-3xl opacity-60" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF6600]/5 pointer-events-none blur-3xl" />

      {/* Main Login Card - Clean centered layout without header */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-[#10131B] rounded-3xl border border-[#1E2436] shadow-2xl shadow-black/80 overflow-hidden">
          
          {/* Card Header Banner with Arena Branding */}
          <div className="p-6 sm:p-8 text-center border-b border-[#1E2436] bg-gradient-to-b from-[#141824] to-[#10131B] flex flex-col items-center">
            <div className="mb-3">
              <ArenaLogo size="lg" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Acesso ao Sistema
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Controle de Quadras, Partidas e Comandas Digitais
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
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Usuário ou E-mail
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: admin ou operador"
                    value={usernameOrEmail}
                    onChange={e => setUsernameOrEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[#1E2436] bg-[#0C0E15] text-white placeholder:text-slate-500 focus:border-[#FF6600] outline-none transition-colors min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[#1E2436] bg-[#0C0E15] text-white placeholder:text-slate-500 focus:border-[#FF6600] outline-none transition-colors min-h-[44px]"
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
                className="w-full py-3 px-4 rounded-xl bg-[#FF6600] hover:bg-[#FF7B1A] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active-press min-h-[46px] mt-2"
              >
                <LogIn size={17} />
                <span>{isLoading ? 'Autenticando...' : 'Acessar Arena Romano'}</span>
              </button>
            </form>
          </div>

          {/* Bottom Card Footer: Middleware & DB Info */}
          <div className="px-6 py-3.5 bg-[#0C0E15] border-t border-[#1E2436] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <Database size={14} className={dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="truncate text-[11px] font-medium">
                {dbStatus ? dbStatus.message : 'Verificando banco...'}
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Seguro
            </span>
          </div>

        </div>
      </main>

      {/* Footer System Status */}
      <footer className="relative z-10 w-full py-3.5 px-4 text-center text-xs text-slate-400 border-t border-[#1E2436] bg-[#0C0E15]/60">
        Arena Romano • Sistema de Gestão Operacional & Financeira
      </footer>
    </div>
  );
};
