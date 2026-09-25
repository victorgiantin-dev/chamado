import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wrench, HardHat, AlertCircle, ArrowRight, ShieldCheck, Database, Check } from 'lucide-react';

interface LoginScreenProps {
  onOpenSupabaseConfig: () => void;
  isSupabaseConfigured: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onOpenSupabaseConfig, isSupabaseConfigured }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Credenciais inválidas.');
      }
    }, 200);
  };

  const handleQuickLogin = (userRole: 'operador' | 'mecanico') => {
    setErrorMessage('');
    if (userRole === 'operador') {
      setUsername('operador');
      setPassword('operador123');
      login('operador', 'operador123');
    } else {
      setUsername('mecanico');
      setPassword('mecanico123');
      login('mecanico', 'mecanico123');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-between text-neutral-100">
      {/* Top micro bar */}
      <header className="border-b border-neutral-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-neutral-100 text-base">SysManut</span>
            <span className="text-xs text-neutral-500 ml-2 hidden sm:inline">Controle Industrial de Manutenção</span>
          </div>
        </div>

        <button
          onClick={onOpenSupabaseConfig}
          type="button"
          className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 transition-colors"
        >
          <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span>{isSupabaseConfigured ? 'Supabase Conectado' : 'Configurar Supabase'}</span>
        </button>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 mb-1">
              Acesso ao Sistema
            </h1>
            <p className="text-sm text-neutral-400">
              Entre com suas credenciais operacionais para gerenciar chamados.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wider">
                Usuário / Matrícula
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="operador ou mecanico"
                required
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wider">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <span>{isLoading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Helper Buttons for user evaluation */}
          <div className="mt-6 pt-6 border-t border-neutral-800/80">
            <span className="text-xs text-neutral-400 font-medium block mb-3">
              Acesso Rápido com as Contas Solicitadas:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('operador')}
                className="p-3 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-neutral-200">Operador</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 group-hover:text-amber-400 transition-colors">1-clique →</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  Login: <strong className="text-neutral-200">operador</strong><br />
                  Senha: <strong className="text-neutral-200">operador123</strong>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('mecanico')}
                className="p-3 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-neutral-200">Mecânico</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 group-hover:text-blue-400 transition-colors">1-clique →</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  Login: <strong className="text-neutral-200">mecanico</strong><br />
                  Senha: <strong className="text-neutral-200">mecanico123</strong>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Ambiente seguro de manutenção preventiva e corretiva</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 px-6 py-4 text-center text-xs text-neutral-500">
        SysManut Industrial · Sistema de Abertura e Encerramento de Ordens de Manutenção
      </footer>
    </div>
  );
};
