import React, { useState } from 'react';
import {
  X,
  Database,
  Check,
  Copy,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  seedSupabaseWithInitialData,
  SUPABASE_SQL_SETUP,
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
  isCurrentlyConnected: boolean;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
  isCurrentlyConnected,
}) => {
  const [url, setUrl] = useState(() => getStoredSupabaseConfig().url);
  const [anonKey, setAnonKey] = useState(() => getStoredSupabaseConfig().anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedSuccessToast, setCopiedSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    saveSupabaseConfig({ url: cleanUrl, anonKey: cleanKey });

    const res = await testSupabaseConnection(cleanUrl, cleanKey);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      onConfigUpdated();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setCopiedSuccessToast(true);
    setTimeout(() => {
      setCopiedSql(false);
      setCopiedSuccessToast(false);
    }, 2500);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    const res = await seedSupabaseWithInitialData();
    setIsSeeding(false);
    setTestResult(res);
    if (res.success) {
      onConfigUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl my-8 overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                Conexão com o Supabase
              </h2>
              <p className="text-xs text-neutral-400">
                Pronto para salvar seus chamados na nuvem em tempo real
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status banner */}
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
              isCurrentlyConnected
                ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                : 'bg-amber-950/30 border-amber-800 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isCurrentlyConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
                }`}
              />
              <div>
                <span className="font-semibold block">
                  {isCurrentlyConnected
                    ? 'Conexão Supabase Ativa e Operante'
                    : 'Modo Local Ativo (Pronto para Supabase)'}
                </span>
                <span className="text-[11px] opacity-80">
                  {isCurrentlyConnected
                    ? 'Todos os chamados abertos e encerrados estão sendo sincronizados no Supabase.'
                    : 'O sistema está salvando no navegador e aguardando suas credenciais do Supabase.'}
                </span>
              </div>
            </div>
          </div>

          {/* Test feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
                  : 'bg-red-950/40 border-red-700 text-red-200'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold block">
                  {testResult.success ? 'Sucesso!' : 'Atenção:'}
                </span>
                <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>Dashboard Supabase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzprojectid.supabase.co"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1 uppercase tracking-wider">
                Supabase Anon Public Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Localizado em Supabase &gt; Project Settings &gt; API &gt; Project API keys (anon public).
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isTesting}
                className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testando Conexão...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Testar e Salvar Credenciais</span>
                  </>
                )}
              </button>

              {isCurrentlyConnected && (
                <button
                  type="button"
                  onClick={handleSeedData}
                  disabled={isSeeding}
                  className="px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Envia dados de exemplo diretamente para o Supabase"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSeeding ? 'Enviando...' : 'Carregar Exemplos no Supabase'}</span>
                </button>
              )}
            </div>
          </form>

          {/* SQL Setup script helper */}
          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider block">
                  Script SQL com Políticas de Armazenamento (RLS)
                </span>
                <span className="text-[11px] text-neutral-400">
                  Inclui DDL da tabela <code className="text-amber-400 font-mono">chamados</code>, índices, triggers e políticas completas do <code className="text-emerald-400 font-mono">storage.buckets</code> e <code className="text-blue-400 font-mono">storage.objects</code>.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-neutral-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar SQL Completo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {copiedSuccessToast && (
              <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] flex items-center gap-2">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Script SQL copiado! Cole diretamente no SQL Editor do seu projeto Supabase e clique em Run.</span>
              </div>
            )}

            {/* Storage policies highlights badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-neutral-950/90 p-2.5 rounded border border-neutral-800">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Tabela:</strong> RLS para Select, Insert e Update</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span><strong>Storage:</strong> Bucket <code className="text-amber-300 font-mono">manutencao-evidencias</code> com RLS</span>
              </div>
            </div>

            <div className="relative">
              <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-48 leading-relaxed">
                {SUPABASE_SQL_SETUP}
              </pre>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
            <span className="font-semibold text-neutral-300 block mb-1">Passo a passo rápido:</span>
            <p>1. Crie seu projeto no <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">supabase.com</a>.</p>
            <p>2. Clique em <strong>SQL Editor</strong> &gt; <strong>New Query</strong>, cole o código acima e clique em <strong>Run</strong>.</p>
            <p>3. Vá em <strong>Project Settings &gt; API</strong>, copie a URL e a anon key e cole nos campos acima.</p>
            <p>4. Clique em <strong>Testar e Salvar Credenciais</strong>. Pronto!</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
