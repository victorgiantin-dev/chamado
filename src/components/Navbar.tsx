import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wrench, HardHat, Database, Plus, LogOut, RefreshCw, UserCheck } from 'lucide-react';
import { ChamadoStatus } from '../types';

interface NavbarProps {
  onOpenNewChamado: () => void;
  onOpenSupabaseConfig: () => void;
  isSupabaseConnected: boolean;
  activeStatusFilter: ChamadoStatus | 'todos';
  onSelectFilter: (filter: ChamadoStatus | 'todos') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewChamado,
  onOpenSupabaseConfig,
  isSupabaseConnected,
  activeStatusFilter,
  onSelectFilter,
  onRefresh,
  isRefreshing,
}) => {
  const { user, logout, switchUserRole } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/95 sticky top-0 z-30 backdrop-blur-md">
      {/* Zone 1, Zone 2, Zone 3 top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-neutral-100 whitespace-nowrap">
            SysManut Industrial
          </span>
        </div>

        {/* Zone 2: Navigation links / Filter tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/90 p-1 rounded-lg border border-neutral-800">
          <button
            type="button"
            onClick={() => onSelectFilter('todos')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeStatusFilter === 'todos'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Todos os Chamados
          </button>
          <button
            type="button"
            onClick={() => onSelectFilter('aberto')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeStatusFilter === 'aberto'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Abertos
          </button>
          <button
            type="button"
            onClick={() => onSelectFilter('em_atendimento')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeStatusFilter === 'em_atendimento'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Em Atendimento
          </button>
          <button
            type="button"
            onClick={() => onSelectFilter('concluido')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeStatusFilter === 'concluido'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Concluídos
          </button>
        </nav>

        {/* Zone 3: Primary actions & User profile */}
        <div className="flex items-center gap-2.5">
          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            title="Atualizar lista de chamados"
            className="p-2 text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Supabase status trigger */}
          <button
            type="button"
            onClick={onOpenSupabaseConfig}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors whitespace-nowrap"
            title="Configurações e conexão do Supabase"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isSupabaseConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="hidden sm:inline font-mono text-[11px]">
              {isSupabaseConnected ? 'Supabase Ativo' : 'Supabase (Local)'}
            </span>
            <Database className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {/* Operator Action: Open ticket button */}
          {user.role === 'operador' && (
            <button
              type="button"
              onClick={onOpenNewChamado}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Abrir Chamado</span>
            </button>
          )}

          {/* User profile & Switcher */}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-medium text-neutral-200 truncate max-w-[130px]">
                {user.name}
              </span>
              <span className="text-[10px] text-neutral-400 capitalize flex items-center justify-end gap-1 font-mono">
                {user.role === 'operador' ? (
                  <>
                    <HardHat className="w-3 h-3 text-amber-400" /> Operador
                  </>
                ) : (
                  <>
                    <Wrench className="w-3 h-3 text-blue-400" /> Mecânico
                  </>
                )}
              </span>
            </div>

            {/* Quick role toggle to test both sides immediately */}
            <button
              type="button"
              onClick={() => switchUserRole(user.role === 'operador' ? 'mecanico' : 'operador')}
              title={`Trocar para perfil de ${user.role === 'operador' ? 'Mecânico' : 'Operador'}`}
              className="p-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg transition-colors flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[11px] font-mono hidden xl:inline">
                Alternar p/ {user.role === 'operador' ? 'Mecânico' : 'Operador'}
              </span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              title="Desconectar do sistema"
              className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile subnav for filters */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 gap-1 border-t border-neutral-800/60 bg-neutral-900/60">
        <button
          type="button"
          onClick={() => onSelectFilter('todos')}
          className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
            activeStatusFilter === 'todos' ? 'bg-neutral-800 text-neutral-100 font-semibold' : 'text-neutral-400'
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter('aberto')}
          className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
            activeStatusFilter === 'aberto' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-neutral-400'
          }`}
        >
          Abertos
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter('em_atendimento')}
          className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
            activeStatusFilter === 'em_atendimento' ? 'bg-blue-500/20 text-blue-300 font-semibold' : 'text-neutral-400'
          }`}
        >
          Em Atendimento
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter('concluido')}
          className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
            activeStatusFilter === 'concluido' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-neutral-400'
          }`}
        >
          Concluídos
        </button>
      </div>
    </header>
  );
};
