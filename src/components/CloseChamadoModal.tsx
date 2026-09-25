import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chamado, MaintenanceType, PartReplaced } from '../types';
import { X, Wrench, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface CloseChamadoModalProps {
  chamado: Chamado | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmClose: (chamadoId: string, resolutionData: Partial<Chamado>) => Promise<void>;
}

export const CloseChamadoModal: React.FC<CloseChamadoModalProps> = ({
  chamado,
  isOpen,
  onClose,
  onConfirmClose,
}) => {
  const { user } = useAuth();

  const [resolutionNotes, setResolutionNotes] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('corretiva_emergencial');
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number>(60);
  const [recommendations, setRecommendations] = useState('');
  const [parts, setParts] = useState<PartReplaced[]>([
    { name: '', code: '', quantity: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !chamado) return null;

  const handleAddPart = () => {
    setParts((prev) => [...prev, { name: '', code: '', quantity: 1 }]);
  };

  const handleRemovePart = (index: number) => {
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePart = (index: number, field: keyof PartReplaced, val: any) => {
    setParts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setErrorMsg('A descrição do que foi feito é obrigatória para encerrar a ordem.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Filter valid parts
    const validParts = parts.filter((p) => p.name.trim().length > 0);

    const now = new Date().toISOString();
    const resolutionData: Partial<Chamado> = {
      status: 'concluido',
      closed_by: user ? `${user.name} (${user.badge})` : 'Roberto Martins (Mecânico)',
      closed_at: now,
      resolution_notes: resolutionNotes.trim(),
      maintenance_type: maintenanceType,
      time_spent_minutes: Number(timeSpentMinutes) || 0,
      recommendations: recommendations.trim() || undefined,
      parts_replaced: validParts,
      production_stopped: false, // Machine released back to production
    };

    await onConfirmClose(chamado.id, resolutionData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl my-8 overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                Encerramento de Manutenção · {chamado.id}
              </h2>
              <p className="text-xs text-neutral-400">
                Descreva os reparos executados pelo mecânico para liberação do equipamento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Machine Context Banner */}
        <div className="px-6 py-3 bg-neutral-950/90 border-b border-neutral-800 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-400">
            <div>
              <span className="text-neutral-500">Equipamento:</span>{' '}
              <strong className="text-neutral-200">{chamado.equipment}</strong>{' '}
              {chamado.tag && <span className="font-mono text-amber-400">[{chamado.tag}]</span>}
            </div>
            <div>
              <span className="text-neutral-500">Setor:</span>{' '}
              <span className="text-neutral-300">{chamado.sector}</span>
            </div>
          </div>
          <p className="text-neutral-300 mt-1 line-clamp-1 italic">
            "{chamado.title}"
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Maintenance Type & Time Spent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Tipo de Manutenção Realizada *
              </label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="corretiva_emergencial">Corretiva Emergencial (Parada)</option>
                <option value="corretiva_programada">Corretiva Programada</option>
                <option value="ajuste_mecanico">Ajuste Mecânico / Reaperto</option>
                <option value="lubrificacao">Lubrificação e Limpeza Técnica</option>
                <option value="eletrica">Elétrica / Pneumática</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Tempo Gasto de Intervenção (minutos) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  step="5"
                  required
                  value={timeSpentMinutes}
                  onChange={(e) => setTimeSpentMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTimeSpentMinutes(30)}
                    className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 text-xs rounded"
                  >
                    30m
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeSpentMinutes(60)}
                    className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 text-xs rounded"
                  >
                    1h
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeSpentMinutes(120)}
                    className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 text-xs rounded"
                  >
                    2h
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description of What Was Done (Mandatory) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider">
                Descrição do que foi feito pelo mecânico *
              </label>
              <span className="text-[11px] text-blue-400">Obrigatório para O.S.</span>
            </div>
            <textarea
              required
              rows={4}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Descreva as ações técnicas executadas: desmontagem, alinhamento, ajustes de folga, medições com relógio comparador, testes a vazio, sangria de linha hidráulica, reaperto de flanges..."
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-blue-500 text-sm leading-relaxed"
            />
          </div>

          {/* Replaced Parts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
                Peças e Componentes Substituídos (Opcional):
              </label>
              <button
                type="button"
                onClick={handleAddPart}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Peça</span>
              </button>
            </div>

            <div className="space-y-2">
              {parts.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleUpdatePart(idx, 'name', e.target.value)}
                    placeholder="Nome da peça (ex: Rolamento 6205-2RS)"
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={p.code || ''}
                    onChange={(e) => handleUpdatePart(idx, 'code', e.target.value)}
                    placeholder="Código almoxarifado"
                    className="w-32 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    min="1"
                    value={p.quantity}
                    onChange={(e) =>
                      handleUpdatePart(idx, 'quantity', parseInt(e.target.value) || 1)
                    }
                    className="w-16 px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 text-xs font-mono text-center focus:outline-none focus:border-blue-500"
                  />
                  {parts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePart(idx)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations for Operators / Next shift */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Recomendações e Observações para o Operador / Próximo Turno
            </label>
            <input
              type="text"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Ex: Não ultrapassar 2500 RPM na primeira hora; checar nível do reservatório após 2 horas."
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Mechanic Signature Confirmation */}
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Mecânico Responsável:</span>
            <span className="font-semibold text-neutral-200">
              {user ? `${user.name} (${user.badge})` : 'Roberto Martins (MEC-102)'}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-lg transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Encerrando...' : 'Encerrar Chamado & Liberar Máquina'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
