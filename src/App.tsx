import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Chamado, ChamadoStatus } from './types';
import {
  fetchChamados,
  createChamado,
  updateChamado,
  getSupabase,
  getStoredSupabaseConfig,
} from './lib/supabase';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { ChamadosList } from './components/ChamadosList';
import { NewChamadoModal } from './components/NewChamadoModal';
import { CloseChamadoModal } from './components/CloseChamadoModal';
import { ChamadoDetailsModal } from './components/ChamadoDetailsModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { PrintTicketModal } from './components/PrintTicketModal';
import { Check, AlertCircle, Wrench, HardHat, Database } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();

  // State
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<ChamadoStatus | 'todos'>('todos');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Selected item
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load Chamados
  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const res = await fetchChamados();
      setChamados(res.chamados);
      setIsSupabaseConnected(res.source === 'supabase');

      if (res.error && !quiet) {
        console.warn('Aviso de conexão:', res.error);
      }
    } catch (e) {
      console.error('Erro ao carregar chamados:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Check if Supabase client is valid
    const client = getSupabase();
    if (client) {
      setIsSupabaseConnected(true);
      // Setup Realtime subscription
      try {
        const channel = client
          .channel('public:chamados')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'chamados' },
            () => {
              loadData(true);
            }
          )
          .subscribe();

        return () => {
          client.removeChannel(channel);
        };
      } catch (err) {
        console.warn('Realtime subscription not supported or errored:', err);
      }
    }
  }, [loadData]);

  // If user is not logged in, render LoginScreen
  if (!user) {
    return (
      <>
        <LoginScreen
          onOpenSupabaseConfig={() => setIsConfigModalOpen(true)}
          isSupabaseConfigured={isSupabaseConnected || !!getStoredSupabaseConfig().url}
        />
        <SupabaseConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onConfigUpdated={() => {
            loadData();
          }}
          isCurrentlyConnected={isSupabaseConnected}
        />
      </>
    );
  }

  // Operator opens ticket
  const handleCreateChamado = async (newChamado: Chamado) => {
    try {
      const res = await createChamado(newChamado);
      setChamados((prev) => [newChamado, ...prev.filter((c) => c.id !== newChamado.id)]);

      if (res.source === 'supabase') {
        showToast(`Chamado ${newChamado.id} criado e salvo no Supabase com sucesso!`, 'success');
      } else {
        showToast(
          `Chamado ${newChamado.id} registrado! (Armazenado localmente pronto para Supabase)`,
          'info'
        );
      }
      loadData(true);
    } catch (err: any) {
      showToast(`Erro ao registrar chamado: ${err.message}`, 'error');
    }
  };

  // Mechanic starts attendance
  const handleStartAttendance = async (chamadoId: string) => {
    const target = chamados.find((c) => c.id === chamadoId);
    if (!target) return;

    const mechanicName = `${user.name} (${user.badge})`;
    const updates: Partial<Chamado> = {
      status: 'em_atendimento',
      assigned_to: mechanicName,
      assigned_at: new Date().toISOString(),
    };

    const res = await updateChamado(chamadoId, updates);
    const updatedChamado = { ...target, ...updates };

    setChamados((prev) =>
      prev.map((c) => (c.id === chamadoId ? updatedChamado : c))
    );

    if (selectedChamado?.id === chamadoId) {
      setSelectedChamado(updatedChamado);
    }

    showToast(
      `Atendimento do chamado ${chamadoId} iniciado por ${user.name}!`,
      'success'
    );
    loadData(true);
  };

  // Mechanic closes ticket and describes what was done
  const handleConfirmClose = async (chamadoId: string, resolutionData: Partial<Chamado>) => {
    const target = chamados.find((c) => c.id === chamadoId);
    if (!target) return;

    const res = await updateChamado(chamadoId, resolutionData);
    const updatedChamado = { ...target, ...resolutionData };

    setChamados((prev) =>
      prev.map((c) => (c.id === chamadoId ? updatedChamado : c))
    );

    if (selectedChamado?.id === chamadoId) {
      setSelectedChamado(updatedChamado);
    }

    showToast(
      `Chamado ${chamadoId} encerrado com sucesso! Equipamento liberado para produção.`,
      'success'
    );
    loadData(true);
  };

  // Reopen ticket
  const handleReopenTicket = async (chamadoId: string) => {
    const updates: Partial<Chamado> = {
      status: 'em_atendimento',
    };
    await updateChamado(chamadoId, updates);
    setChamados((prev) =>
      prev.map((c) => (c.id === chamadoId ? { ...c, ...updates } : c))
    );
    if (selectedChamado?.id === chamadoId) {
      setSelectedChamado((prev) => (prev ? { ...prev, ...updates } : null));
    }
    showToast(`Chamado ${chamadoId} reaberto para intervenção adicional.`, 'info');
    loadData(true);
  };

  const handleSelectChamado = (chamado: Chamado) => {
    setSelectedChamado(chamado);
    setIsDetailsModalOpen(true);
  };

  const handleRequestClose = (chamado: Chamado) => {
    setSelectedChamado(chamado);
    setIsCloseModalOpen(true);
  };

  const handlePrintTicket = (chamado: Chamado) => {
    setSelectedChamado(chamado);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs max-w-md ${
              toast.type === 'success'
                ? 'bg-neutral-900 border-emerald-600/80 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-neutral-900 border-red-600/80 text-red-200'
                : 'bg-neutral-900 border-amber-600/80 text-amber-200'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="leading-snug">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <Navbar
        onOpenNewChamado={() => setIsNewModalOpen(true)}
        onOpenSupabaseConfig={() => setIsConfigModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        activeStatusFilter={activeStatusFilter}
        onSelectFilter={setActiveStatusFilter}
        onRefresh={() => loadData(false)}
        isRefreshing={isRefreshing}
      />

      {/* Context Role Notification Bar */}
      <div className="bg-neutral-900/60 border-b border-neutral-800/60 py-2.5 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-neutral-400">
          <div className="flex items-center gap-2">
            {user.role === 'operador' ? (
              <>
                <HardHat className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-neutral-200 font-medium">Perfil Operador Ativo:</span>
                <span>
                  Você pode abrir novos chamados detalhando a máquina, sintomas e paradas de linha.
                </span>
              </>
            ) : (
              <>
                <Wrench className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-neutral-200 font-medium">Perfil Mecânico Ativo:</span>
                <span>
                  Você pode assumir atendimentos, registrar peças substituídas e encerrar chamados com o relatório técnico.
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-neutral-500">
              Setor: <strong className="text-neutral-300 font-normal">{user.department.split('&')[0]}</strong>
            </span>
            <span className="text-neutral-600">·</span>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <Database className="w-3 h-3 text-neutral-500" />
              <span>{isSupabaseConnected ? 'Supabase Nuvem' : 'Local (Conectar Nuvem)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Overview */}
        <StatsOverview chamados={chamados} />

        {/* Chamados Management List */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-neutral-100 tracking-tight">
              Quadro de Ordens de Serviço & Chamados
            </h2>
            {user.role === 'operador' && (
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                + Abrir Novo Chamado
              </button>
            )}
          </div>

          <ChamadosList
            chamados={chamados}
            activeStatusFilter={activeStatusFilter}
            onSelectChamado={handleSelectChamado}
            onStartAttendance={handleStartAttendance}
            onRequestCloseTicket={handleRequestClose}
            onOpenNewTicket={() => setIsNewModalOpen(true)}
          />
        </div>
      </main>

      {/* Modals */}
      <NewChamadoModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateChamado}
      />

      <CloseChamadoModal
        chamado={selectedChamado}
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirmClose={handleConfirmClose}
      />

      <ChamadoDetailsModal
        chamado={selectedChamado}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onStartAttendance={handleStartAttendance}
        onRequestCloseTicket={handleRequestClose}
        onPrintTicket={handlePrintTicket}
        onReopenTicket={handleReopenTicket}
      />

      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigUpdated={() => loadData(false)}
        isCurrentlyConnected={isSupabaseConnected}
      />

      <PrintTicketModal
        chamado={selectedChamado}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-4 px-6 text-center text-xs text-neutral-500 font-mono">
        SysManut Industrial v1.0 · Operador (operador/operador123) · Mecânico (mecanico/mecanico123) · Supabase Ready
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
