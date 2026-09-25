import React from 'react';
import { Chamado } from '../types';
import { X, Printer } from 'lucide-react';

interface PrintTicketModalProps {
  chamado: Chamado | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  chamado,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !chamado) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleString('pt-BR');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl my-8 overflow-hidden text-neutral-100 print:bg-white print:text-black print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-950 print:hidden">
          <span className="text-xs font-semibold text-neutral-300">
            Visualização de Impressão da Ordem de Serviço
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 bg-neutral-950 text-neutral-200 print:bg-white print:text-black print:p-6 text-xs font-sans max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Header */}
          <div className="border-b-2 border-neutral-700 print:border-black pb-4 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white print:text-black uppercase">
                SysManut · Ordem de Serviço de Manutenção
              </h1>
              <p className="text-[11px] text-neutral-400 print:text-neutral-600">
                Departamento de Manutenção Mecânica & Eletropneumática Industrial
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-mono font-bold text-amber-400 print:text-black block">
                {chamado.id}
              </span>
              <span className="text-[11px] text-neutral-400 print:text-neutral-600">
                Status: {chamado.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Machine Details Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-900 print:bg-neutral-100 border border-neutral-800 print:border-neutral-300 rounded mb-4">
            <div>
              <span className="text-[10px] text-neutral-500 print:text-neutral-600 uppercase block font-semibold">
                Equipamento
              </span>
              <span className="font-semibold text-white print:text-black">{chamado.equipment}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 print:text-neutral-600 uppercase block font-semibold">
                Tag da Máquina
              </span>
              <span className="font-mono text-amber-400 print:text-black">{chamado.tag || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 print:text-neutral-600 uppercase block font-semibold">
                Setor Fabril
              </span>
              <span className="text-white print:text-black">{chamado.sector}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 print:text-neutral-600 uppercase block font-semibold">
                Prioridade
              </span>
              <span className="uppercase font-semibold text-amber-400 print:text-black">
                {chamado.priority} {chamado.production_stopped ? '(Linha Parada)' : ''}
              </span>
            </div>
          </div>

          {/* Operador Section */}
          <div className="mb-5 border border-neutral-800 print:border-neutral-300 rounded p-3 bg-neutral-900/40 print:bg-white">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-neutral-800 print:border-neutral-300">
              <span className="font-bold uppercase tracking-wider text-amber-400 print:text-black">
                1. Abertura do Chamado (Operador)
              </span>
              <span className="text-[10px] text-neutral-400 print:text-neutral-600">
                {formatDate(chamado.created_at)} · {chamado.opened_by}
              </span>
            </div>
            <div className="mb-2 font-semibold text-white print:text-black">
              Título: {chamado.title}
            </div>
            <div className="text-neutral-300 print:text-neutral-800 leading-relaxed whitespace-pre-line mb-2">
              {chamado.description}
            </div>
            {chamado.symptoms && chamado.symptoms.length > 0 && (
              <div className="text-[11px] text-neutral-400 print:text-neutral-600">
                <strong>Sintomas:</strong> {chamado.symptoms.join(', ')}
              </div>
            )}
          </div>

          {/* Mecanico Section */}
          <div className="mb-5 border border-neutral-800 print:border-neutral-300 rounded p-3 bg-neutral-900/40 print:bg-white">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-neutral-800 print:border-neutral-300">
              <span className="font-bold uppercase tracking-wider text-blue-400 print:text-black">
                2. Intervenção e Resolução Técnica (Mecânico)
              </span>
              <span className="text-[10px] text-neutral-400 print:text-neutral-600">
                {chamado.closed_at ? formatDate(chamado.closed_at) : 'Em andamento'} ·{' '}
                {chamado.closed_by || chamado.assigned_to || 'Pendente'}
              </span>
            </div>

            {chamado.status === 'concluido' ? (
              <>
                <div className="mb-2">
                  <span className="font-semibold text-neutral-400 print:text-neutral-700 block text-[11px]">
                    Descrição do Serviço Executado:
                  </span>
                  <div className="text-neutral-300 print:text-neutral-800 leading-relaxed whitespace-pre-line">
                    {chamado.resolution_notes}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] border-t border-neutral-800 print:border-neutral-300 mb-2">
                  <div>
                    <span className="text-neutral-400 print:text-neutral-600">Tipo de Manutenção:</span>{' '}
                    <span className="font-semibold text-white print:text-black uppercase">
                      {chamado.maintenance_type || 'Corretiva'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 print:text-neutral-600">Tempo de Intervenção:</span>{' '}
                    <span className="font-semibold text-white print:text-black font-mono">
                      {chamado.time_spent_minutes || 0} minutos
                    </span>
                  </div>
                </div>

                {chamado.parts_replaced && chamado.parts_replaced.length > 0 && (
                  <div className="pt-2 border-t border-neutral-800 print:border-neutral-300 mb-2">
                    <span className="font-semibold text-neutral-400 print:text-neutral-700 block text-[11px] mb-1">
                      Peças e Componentes Aplicados:
                    </span>
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-neutral-800 print:border-neutral-300 text-neutral-500">
                          <th className="py-1">Item / Descrição</th>
                          <th className="py-1">Código</th>
                          <th className="py-1 text-right">Quantidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chamado.parts_replaced.map((p, idx) => (
                          <tr key={idx} className="border-b border-neutral-900 print:border-neutral-200">
                            <td className="py-1 text-neutral-200 print:text-black">{p.name}</td>
                            <td className="py-1 text-neutral-400 print:text-neutral-700 font-mono">
                              {p.code || '-'}
                            </td>
                            <td className="py-1 text-right font-mono text-neutral-200 print:text-black">
                              {p.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {chamado.recommendations && (
                  <div className="pt-2 border-t border-neutral-800 print:border-neutral-300 text-[11px]">
                    <span className="font-semibold text-amber-400 print:text-black block">
                      Recomendações ao Operador:
                    </span>
                    <span className="text-neutral-300 print:text-neutral-800 italic">
                      {chamado.recommendations}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-neutral-500 italic py-3 text-center">
                Atendimento ainda não concluído pelo mecânico.
              </div>
            )}
          </div>

          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-neutral-800 print:border-neutral-400 text-center">
            <div>
              <div className="border-b border-neutral-700 print:border-black h-8 mb-2" />
              <span className="text-[11px] font-semibold text-white print:text-black block">
                {chamado.opened_by}
              </span>
              <span className="text-[10px] text-neutral-500 print:text-neutral-600">
                Operador Solicitante
              </span>
            </div>
            <div>
              <div className="border-b border-neutral-700 print:border-black h-8 mb-2" />
              <span className="text-[11px] font-semibold text-white print:text-black block">
                {chamado.closed_by || chamado.assigned_to || 'Mecânico de Plantão'}
              </span>
              <span className="text-[10px] text-neutral-500 print:text-neutral-600">
                Mecânico de Manutenção
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
