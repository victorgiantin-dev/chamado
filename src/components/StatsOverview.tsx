import React from 'react';
import { Chamado } from '../types';
import { AlertTriangle, Clock, CheckCircle2, AlertOctagon, Layers } from 'lucide-react';

interface StatsOverviewProps {
  chamados: Chamado[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ chamados }) => {
  const total = chamados.length;
  const abertos = chamados.filter((c) => c.status === 'aberto').length;
  const emAtendimento = chamados.filter((c) => c.status === 'em_atendimento').length;
  const concluidos = chamados.filter((c) => c.status === 'concluido').length;
  const paradasAtivas = chamados.filter(
    (c) => c.production_stopped && (c.status === 'aberto' || c.status === 'em_atendimento')
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {/* Total */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-medium">Total de O.S.</span>
          <Layers className="w-4 h-4 text-neutral-500" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-neutral-100">
          {total}
        </div>
        <div className="text-[11px] text-neutral-500 mt-1">
          Histórico registrado
        </div>
      </div>

      {/* Abertos / Fila */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between text-amber-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-medium">Aguardando</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
          {abertos}
        </div>
        <div className="text-[11px] text-neutral-500 mt-1">
          Fila para a mecânica
        </div>
      </div>

      {/* Em atendimento */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between text-blue-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-medium">Em Execução</span>
          <AlertTriangle className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-blue-400">
          {emAtendimento}
        </div>
        <div className="text-[11px] text-neutral-500 mt-1">
          Mecânicos atuando
        </div>
      </div>

      {/* Paradas Críticas */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between text-red-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-medium">Linha Parada</span>
          <AlertOctagon className="w-4 h-4 text-red-500" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-red-400">
          {paradasAtivas}
        </div>
        <div className="text-[11px] text-neutral-500 mt-1">
          Impacto em produção
        </div>
      </div>

      {/* Concluídos */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-emerald-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-medium">Finalizados</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
          {concluidos}
        </div>
        <div className="text-[11px] text-neutral-500 mt-1">
          Resolvidos & arquivados
        </div>
      </div>
    </div>
  );
};
