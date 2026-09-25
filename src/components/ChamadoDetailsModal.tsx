import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Chamado } from '../types';
import {
  X,
  Printer,
  Wrench,
  Clock,
  HardHat,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckSquare,
} from 'lucide-react';

interface ChamadoDetailsModalProps {
  chamado: Chamado | null;
  isOpen: boolean;
  onClose: () => void;
  onStartAttendance: (chamadoId: string) => Promise<void>;
  onRequestCloseTicket: (chamado: Chamado) => void;
  onPrintTicket: (chamado: Chamado) => void;
  onReopenTicket?: (chamadoId: string) => Promise<void>;
}

export const ChamadoDetailsModal: React.FC<ChamadoDetailsModalProps> = ({
  chamado,
  isOpen,
  onClose,
  onStartAttendance,
  onRequestCloseTicket,
  onPrintTicket,
  onReopenTicket,
}) => {
  const { user } = useAuth();

  if (!isOpen || !chamado) return null;

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusDisplay = (st: Chamado['status']) => {
    switch (st) {
      case 'aberto':
        return { label: 'Aberto (Aguardando Atendimento)', color: 'text-amber-400' };
      case 'em_atendimento':
        return { label: 'Em Atendimento Técnico', color: 'text-blue-400' };
      case 'concluido':
        return { label: 'Concluído e Liberado', color: 'text-emerald-400' };
      default:
        return { label: st, color: 'text-neutral-400' };
    }
  };

  const statusInfo = getStatusDisplay(chamado.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl my-8 overflow-hidden text-neutral-100">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-neutral-200">
              {chamado.id}
            </span>
            <span className="text-neutral-500">·</span>
            <span className={`text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {chamado.production_stopped && (
              <>
                <span className="text-neutral-500">·</span>
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Linha Parada
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintTicket(chamado)}
              title="Visualizar e Imprimir O.S."
              className="p-1.5 text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir O.S.</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Machine Header */}
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
              <span>{chamado.sector}</span>
              {chamado.tag && (
                <>
                  <span>·</span>
                  <span className="font-mono text-amber-400 font-semibold">{chamado.tag}</span>
                </>
              )}
              <span>·</span>
              <span className="capitalize">Prioridade {chamado.priority}</span>
            </div>
            <h1 className="text-lg font-bold text-neutral-100">{chamado.equipment}</h1>
            <p className="text-sm font-medium text-neutral-300 mt-1">{chamado.title}</p>
          </div>

          {/* Timeline & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
            <div>
              <span className="text-neutral-500 block">Abertura:</span>
              <span className="text-neutral-300 font-medium">{formatDate(chamado.created_at)}</span>
              <span className="text-neutral-400 text-[11px] block mt-0.5">{chamado.opened_by}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Início Atendimento:</span>
              <span className="text-neutral-300 font-medium">{formatDate(chamado.assigned_at)}</span>
              <span className="text-neutral-400 text-[11px] block mt-0.5">
                {chamado.assigned_to || 'Aguardando mecânico'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">Encerramento:</span>
              <span className="text-neutral-300 font-medium">{formatDate(chamado.closed_at)}</span>
              <span className="text-neutral-400 text-[11px] block mt-0.5">
                {chamado.closed_by || (chamado.status === 'concluido' ? 'Concluído' : 'Pendente')}
              </span>
            </div>
          </div>

          {/* Section 1: Relato do Operador */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
              <HardHat className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Informações Descritivas do Operador
              </h3>
            </div>

            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800/80">
              <p className="text-sm text-neutral-200 whitespace-pre-line leading-relaxed">
                {chamado.description}
              </p>

              {chamado.symptoms && chamado.symptoms.length > 0 && (
                <div className="mt-4 pt-3 border-t border-neutral-900">
                  <span className="text-xs text-neutral-400 font-medium block mb-2">
                    Sintomas Reportados:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
                    {chamado.symptoms.map((s, idx) => (
                      <span key={idx} className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                        • {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {chamado.photo_url && (
                <div className="mt-4 pt-3 border-t border-neutral-900">
                  <span className="text-xs text-neutral-400 font-medium block mb-2">
                    Evidência Fotográfica Anexada:
                  </span>
                  <div className="overflow-hidden rounded-lg border border-neutral-800 max-w-sm">
                    <img
                      src={chamado.photo_url}
                      alt="Evidência do operador"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-56 object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Resolução do Mecânico */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Wrench className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Relatório de Intervenção Mecânica
              </h3>
            </div>

            {chamado.status === 'concluido' ? (
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800/80 space-y-4">
                <div>
                  <span className="text-xs text-neutral-400 block mb-1 uppercase tracking-wider font-medium">
                    Serviço Executado:
                  </span>
                  <p className="text-sm text-neutral-200 whitespace-pre-line leading-relaxed">
                    {chamado.resolution_notes || 'Nenhuma nota registrada.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-900 text-xs">
                  <div>
                    <span className="text-neutral-500">Tipo de Manutenção:</span>
                    <span className="text-neutral-300 ml-1 font-medium capitalize">
                      {chamado.maintenance_type ? chamado.maintenance_type.replace('_', ' ') : 'Corretiva'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Tempo de Intervenção:</span>
                    <span className="text-neutral-300 ml-1 font-mono font-medium tabular-nums">
                      {chamado.time_spent_minutes || 0} minutos
                    </span>
                  </div>
                </div>

                {chamado.parts_replaced && chamado.parts_replaced.length > 0 && (
                  <div className="pt-3 border-t border-neutral-900">
                    <span className="text-xs text-neutral-400 block mb-2 uppercase tracking-wider font-medium">
                      Peças e Componentes Substituídos:
                    </span>
                    <div className="divide-y divide-neutral-900 bg-neutral-900/50 rounded border border-neutral-800">
                      {chamado.parts_replaced.map((p, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-neutral-200 font-medium">{p.name}</span>
                            {p.code && (
                              <span className="text-[11px] font-mono text-neutral-400 ml-2">
                                [Cód: {p.code}]
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-neutral-300 tabular-nums">
                            Qtd: {p.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {chamado.recommendations && (
                  <div className="pt-3 border-t border-neutral-900 text-xs">
                    <span className="text-amber-400 font-medium block mb-1">
                      Recomendações e Instruções Operacionais:
                    </span>
                    <p className="text-neutral-300 italic">{chamado.recommendations}</p>
                  </div>
                )}
              </div>
            ) : chamado.status === 'em_atendimento' ? (
              <div className="bg-blue-950/20 border border-blue-900/40 p-4 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-medium">
                  <Clock className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Chamado em atendimento ativo pelo mecânico:</span>
                </div>
                <p className="text-neutral-300">
                  Responsável:{' '}
                  <strong className="text-neutral-100">{chamado.assigned_to || 'Mecânico'}</strong>{' '}
                  desde {formatDate(chamado.assigned_at)}.
                </p>
                <p className="text-neutral-400 text-[11px]">
                  O encerramento e a descrição detalhada das atividades executadas serão registradas na conclusão.
                </p>
              </div>
            ) : (
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg text-xs text-neutral-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Chamado aberto aguardando triagem ou início de atendimento por um mecânico.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-400">
            {user?.role === 'operador' ? (
              <span>Modo Operador (Visualização e Acompanhamento)</span>
            ) : (
              <span>Modo Mecânico (Ações de Intervenção e Encerramento)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mechanic Actions */}
            {user?.role === 'mecanico' && chamado.status === 'aberto' && (
              <button
                type="button"
                onClick={() => onStartAttendance(chamado.id)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Assumir / Iniciar Atendimento</span>
              </button>
            )}

            {user?.role === 'mecanico' && chamado.status === 'em_atendimento' && (
              <button
                type="button"
                onClick={() => onRequestCloseTicket(chamado)}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Encerrar Chamado & Relatar Reparo</span>
              </button>
            )}

            {user?.role === 'mecanico' && chamado.status === 'concluido' && onReopenTicket && (
              <button
                type="button"
                onClick={() => onReopenTicket(chamado.id)}
                className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reabrir Chamado</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-900 border border-neutral-800 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
