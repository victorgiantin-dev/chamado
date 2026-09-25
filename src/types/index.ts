export type UserRole = 'operador' | 'mecanico';

export interface User {
  username: string;
  name: string;
  role: UserRole;
  badge: string;
  department: string;
}

export type Priority = 'baixa' | 'media' | 'alta' | 'critica';

export type ChamadoStatus = 'aberto' | 'em_atendimento' | 'aguardando_pecas' | 'concluido';

export type MaintenanceType =
  | 'corretiva_emergencial'
  | 'corretiva_programada'
  | 'ajuste_mecanico'
  | 'lubrificacao'
  | 'eletrica';

export interface PartReplaced {
  name: string;
  code?: string;
  quantity: number;
}

export interface Chamado {
  id: string; // e.g. OS-2026-0104
  equipment: string;
  tag?: string;
  sector: string;
  priority: Priority;
  title: string;
  description: string;
  symptoms?: string[];
  production_stopped: boolean;
  photo_url?: string;
  status: ChamadoStatus;
  opened_by: string;
  created_at: string; // ISO
  updated_at: string; // ISO

  // Mechanic resolution fields
  assigned_to?: string;
  assigned_at?: string;
  closed_by?: string;
  closed_at?: string;
  resolution_notes?: string;
  maintenance_type?: MaintenanceType;
  parts_replaced?: PartReplaced[];
  time_spent_minutes?: number;
  recommendations?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastTestedAt?: string;
  tableName: string;
}
