import React, { useState, useMemo } from 'react';
import { Chamado, ChamadoStatus, Priority } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ChevronRight,
  Wrench,
  HardHat,
  Play,
  FileText,
} from 'lucide-react';

interface ChamadosListProps {
  chamados: Chamado[];
  activeStatusFilter: ChamadoStatus | 'todos';
  onSelectChamado: (chamado: Chamado) => void;
  onStartAttendance: (chamadoId: string) => Promise<void>;
  onRequestCloseTicket: (chamado: Chamado) => void;
  onOpenNewTicket: () => void;
}

export const ChamadosList: React.FC<ChamadosListProps> = ({
  chamados,
  activeStatusFilter,
  onSelectChamado,
  onStartAttendance,
  onRequestCloseTicket,
  onOpenNewTicket,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('todas');
  const [selectedSector, setSelectedSector] = useState<string>('todos');
  const [onlyStopped, setOnlyStopped] = useState(false);

  // Extract unique sectors
  const sectors = useMemo(() => {
    const set = new Set(chamados.map((c) => c.sector));
    return Array.from(set).sort();
  }, [chamados]);

  // Filtered Chamados
  const filteredChamados = useMemo(() => {
    return chamados.filter((c) => {
      // Status filter
      if (activeStatusFilter !== 'todos' && c.status !== activeStatusFilter) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'todas' && c.priority !== selectedPriority) {
        return false;
      }

      // Sector filter
      if (selectedSector !== 'todos' && c.sector !== selectedSector) {
        return false;
      }

      // Production stopped filter
      if (onlyStopped && !c.production_stopped) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchEquipment = c.equipment.toLowerCase().includes(query);
        const matchTag = c.tag?.toLowerCase().includes(query);
        const matchId = c.id.toLowerCase().includes(query);
        const matchTitle = c.title.toLowerCase().includes(query);
        const matchDesc = c.description.toLowerCase().includes(query);
        const matchOp = c.opened_by.toLowerCase().includes(query);
        const matchMec = c.closed_by?.toLowerCase().includes(query) || c.assigned_to?.toLowerCase().includes(query);

        if (!matchEquipment && !matchTag && !matchId && !matchTitle && !matchDesc && !matchOp && !matchMec) {
          return false;
        }
      }

      return true;
    });
  }, [chamados, activeStatusFilter, selectedPriority, selectedSector, onlyStopped, searchTerm]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'critica':
        return (
          <span className="text-red-400 font-semibold flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Crítica</span>
          </span>
        );
      case 'alta':
        return (
          <span className="text-orange-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alta</span>
          </span>
        );
      case 'media':
        return (
          <span className="text-amber-400 font-medium flex items-center gap-1">
            <span>Média</span>
          </span>
        );
      case 'baixa':
        return (
          <span className="text-emerald-400 font-normal flex items-center gap-1">
            <span>Baixa</span>
          </span>
        );
    }
  };

  const getStatusBadge = (st: ChamadoStatus) => {
    switch (st) {
      case 'aberto':
        return (
          <span className="text-amber-300 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Aberto</span>
          </span>
        );
      case 'em_atendimento':
        return (
          <span className="text-blue-300 font-medium flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Em Atendimento</span>
          </span>
        );
      case 'concluido':
        return (
          <span className="text-emerald-300 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Concluído</span>
          </span>
        );
      default:
        return <span>{st}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por O.S., máquina, tag (ex: TNC-04), setor ou sintoma..."
              className="w-full pl-9 pr-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Priority filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="todas">Todas as Urgências</option>
              <option value="critica">Crítica (Parada)</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          {/* Sector filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="todos">Todos os Setores</option>
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick filters row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/60 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300 hover:text-neutral-100">
              <input
                type="checkbox"
                checked={onlyStopped}
                onChange={(e) => setOnlyStopped(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-950 text-red-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="flex items-center gap-1 font-medium">
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                <span>Apenas Máquinas com Parada de Linha</span>
              </span>
            </label>
          </div>

          <div className="text-neutral-500 text-[11px] font-mono tabular-nums">
            Exibindo <strong>{filteredChamados.length}</strong> de {chamados.length} chamados
          </div>
        </div>
      </div>

      {/* List of Tickets */}
      {filteredChamados.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-300">
            Nenhum chamado encontrado com os filtros selecionados
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Tente remover os filtros aplicados ou abrir um novo chamado caso tenha ocorrido um problema técnico.
          </p>
          {user?.role === 'operador' && (
            <button
              type="button"
              onClick={onOpenNewTicket}
              className="mt-2 px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
            >
              Abrir Novo Chamado
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredChamados.map((item) => {
            const isStopped = item.production_stopped && item.status !== 'concluido';
            return (
              <div
                key={item.id}
                onClick={() => onSelectChamado(item)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group bg-neutral-900 hover:bg-neutral-900/90 ${
                  isStopped
                    ? 'border-red-900/60 hover:border-red-700/80 bg-red-950/10'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left Column: ID, Equipment, Title, Description */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Metadata line (Zero-pill text styling) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-mono">
                      <span className="font-bold text-neutral-200">{item.id}</span>
                      <span>·</span>
                      <span className="text-neutral-400">{item.sector}</span>
                      {item.tag && (
                        <>
                          <span>·</span>
                          <span className="text-amber-400 font-semibold">{item.tag}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{getPriorityBadge(item.priority)}</span>
                      <span>·</span>
                      <span>{getStatusBadge(item.status)}</span>
                      {isStopped && (
                        <>
                          <span>·</span>
                          <span className="text-red-400 font-bold uppercase tracking-wider text-[11px]">
                            Parada de Linha
                          </span>
                        </>
                      )}
                    </div>

                    {/* Equipment Name & Title */}
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-neutral-100 group-hover:text-amber-400 transition-colors">
                        {item.equipment}
                      </h4>
                      <p className="text-xs sm:text-sm font-medium text-neutral-300 line-clamp-1">
                        {item.title}
                      </p>
                    </div>

                    {/* Operator Description Snippet */}
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Mechanic Resolution Preview if closed */}
                    {item.status === 'concluido' && item.resolution_notes && (
                      <div className="mt-2 p-2.5 rounded bg-neutral-950/80 border border-neutral-800/80 text-xs text-neutral-300">
                        <span className="font-semibold text-emerald-400 block mb-0.5 text-[11px] uppercase tracking-wider">
                          Solução do Mecânico:
                        </span>
                        <p className="line-clamp-2 text-neutral-300 italic">
                          {item.resolution_notes}
                        </p>
                        {item.parts_replaced && item.parts_replaced.length > 0 && (
                          <div className="mt-1 text-[11px] text-neutral-500 font-mono">
                            Peças trocadas: {item.parts_replaced.map((p) => `${p.name} (${p.quantity}x)`).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Timestamps & Quick Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                    <div className="text-right text-[11px] text-neutral-500 font-mono tabular-nums">
                      <div>Aberto: {formatDate(item.created_at)}</div>
                      <div className="text-neutral-400 truncate max-w-[150px]">
                        Por: {item.opened_by.split(' ')[0]}
                      </div>
                      {item.closed_at && (
                        <div className="text-emerald-500 mt-1">
                          Concluído: {formatDate(item.closed_at)}
                        </div>
                      )}
                    </div>

                    {/* Contextual Action Button */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {user?.role === 'mecanico' && item.status === 'aberto' && (
                        <button
                          type="button"
                          onClick={() => onStartAttendance(item.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Atender</span>
                        </button>
                      )}

                      {user?.role === 'mecanico' && item.status === 'em_atendimento' && (
                        <button
                          type="button"
                          onClick={() => onRequestCloseTicket(item)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Encerrar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectChamado(item)}
                        className="p-1.5 text-neutral-400 group-hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
                        title="Ver detalhes completos"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
