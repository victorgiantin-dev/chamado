import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chamado, Priority } from '../types';
import { X, AlertTriangle, Upload, Check, HardHat, Camera, Loader2 } from 'lucide-react';
import { uploadEvidenciaToSupabase } from '../lib/supabase';

interface NewChamadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (chamado: Chamado) => Promise<void>;
}

const COMMON_EQUIPMENT = [
  { name: 'Torno CNC Mazak Quick Turn 200', tag: 'TNC-04', sector: 'Usinagem de Precisão' },
  { name: 'Prensa Excêntrica Schuler 250T', tag: 'PR-12', sector: 'Estamparia Pesada' },
  { name: 'Injetora Romi Primax 400', tag: 'INJ-07', sector: 'Injeção Plástica' },
  { name: 'Fresadora Centro de Usinagem Romi D800', tag: 'CU-02', sector: 'Usinagem de Precisão' },
  { name: 'Esteira Transportadora Modular Linha 02', tag: 'EST-02', sector: 'Embalagem Final' },
  { name: 'Compressor Parafuso Atlas Copco GA37', tag: 'CMP-01', sector: 'Central de Utilidades' },
  { name: 'Robô de Solda Fanuc ArcMate 120iD', tag: 'ROB-03', sector: 'Caldeiraria & Solda' },
];

const SECTORS = [
  'Usinagem de Precisão',
  'Estamparia Pesada',
  'Injeção Plástica',
  'Caldeiraria & Solda',
  'Linha de Montagem 01',
  'Embalagem Final',
  'Central de Utilidades',
  'Expedição & Logística',
];

const QUICK_SYMPTOMS = [
  'Ruído metálico / atrito',
  'Vazamento hidráulico / óleo',
  'Vibração anormal excessiva',
  'Superaquecimento térmico',
  'Alarme / Código de erro no CLP',
  'Travamento de eixo mecânico',
  'Pressão pneumática baixa',
  'Cheiro característico de queimado',
];

export const NewChamadoModal: React.FC<NewChamadoModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { user } = useAuth();

  const [equipment, setEquipment] = useState('');
  const [tag, setTag] = useState('');
  const [sector, setSector] = useState(SECTORS[0]);
  const [priority, setPriority] = useState<Priority>('alta');
  const [productionStopped, setProductionStopped] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  if (!isOpen) return null;

  const handleSelectQuickEquipment = (eq: typeof COMMON_EQUIPMENT[0]) => {
    setEquipment(eq.name);
    setTag(eq.tag);
    setSector(eq.sector);
  };

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show immediate local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 2. Try upload to Supabase Storage if configured
      setIsUploadingPhoto(true);
      const res = await uploadEvidenciaToSupabase(file);
      setIsUploadingPhoto(false);

      if (res.url) {
        setPhotoUrl(res.url);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment.trim() || !title.trim() || !description.trim()) {
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const osNumber = `OS-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newChamado: Chamado = {
      id: osNumber,
      equipment: equipment.trim(),
      tag: tag.trim() || undefined,
      sector,
      priority,
      title: title.trim(),
      description: description.trim(),
      symptoms: selectedSymptoms,
      production_stopped: productionStopped,
      photo_url: photoUrl || undefined,
      status: 'aberto',
      opened_by: user ? `${user.name} (${user.badge})` : 'Operador',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    await onSubmit(newChamado);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl my-8 overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                Abertura de Chamado Técnico
              </h2>
              <p className="text-xs text-neutral-400">
                Preencha as informações descritivas para a equipe de mecânica
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick select equipment */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wider">
              Atalhos de Máquinas Comuns da Fábrica:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_EQUIPMENT.slice(0, 4).map((eq) => (
                <button
                  type="button"
                  key={eq.tag}
                  onClick={() => handleSelectQuickEquipment(eq)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    tag === eq.tag
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  {eq.tag} · {eq.name.split(' ')[0]} {eq.name.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Machine & Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nome da Máquina / Equipamento *
              </label>
              <input
                type="text"
                required
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="Ex: Torno CNC Mazak Quick Turn 200"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Tag / Código
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ex: TNC-04"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 text-sm font-mono uppercase"
              />
            </div>
          </div>

          {/* Sector & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Setor Fabril *
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-amber-500 text-sm cursor-pointer"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nível de Urgência *
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['baixa', 'media', 'alta', 'critica'] as Priority[]).map((p) => {
                  const labels = {
                    baixa: 'Baixa',
                    media: 'Média',
                    alta: 'Alta',
                    critica: 'Crítica',
                  };
                  const active = priority === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-1.5 text-xs font-medium rounded border transition-colors capitalize ${
                        active
                          ? p === 'critica'
                            ? 'bg-red-500/20 text-red-300 border-red-500'
                            : p === 'alta'
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500'
                            : p === 'media'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {labels[p]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Production Stopped Warning Toggle */}
          <div
            onClick={() => setProductionStopped(!productionStopped)}
            className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
              productionStopped
                ? 'bg-red-950/40 border-red-700/60 text-red-200'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border ${
                  productionStopped
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'border-neutral-700 bg-neutral-900'
                }`}
              >
                {productionStopped && <Check className="w-3.5 h-3.5" />}
              </div>
              <div>
                <span className="text-xs font-semibold block">
                  A máquina está totalmente parada / impedindo produção?
                </span>
                <span className="text-[11px] text-neutral-400">
                  Sinaliza alarme de parada de linha imediato para o mecânico de plantão.
                </span>
              </div>
            </div>
            {productionStopped && (
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                Linha Parada
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Título / Resumo da Ocorrência *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aquecimento excessivo no rolamento do fuso com ruído agudo"
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          {/* Quick Symptoms */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wider">
              Sintomas Observados no Chão de Fábrica:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    type="button"
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Descrição Detalhada do Problema *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva com detalhes o que aconteceu, ruídos ouvidos, quando começou, temperatura medida, se houve cheiro de queimado, ou qualquer indício relevante para o mecânico..."
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 text-sm leading-relaxed"
            />
          </div>

          {/* Photo attachment */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Foto / Evidência da Máquina (Opcional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-medium text-neutral-300 cursor-pointer transition-colors">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Anexar Imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {photoUrl ? (
                <div className="flex items-center gap-2">
                  <img
                    src={photoUrl}
                    alt="Evidência anexada"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover rounded border border-neutral-700"
                  />
                  <span className="text-xs text-emerald-400">Imagem carregada</span>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-xs text-red-400 hover:underline ml-1"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <span className="text-xs text-neutral-500">
                  Formatos aceitos: JPG, PNG, WEBP (fotos do celular/computador)
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Gravando Chamado...' : 'Confirmar e Abrir Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
