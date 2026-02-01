export interface ApiKey {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
  key_preview: string;
  created_at: string;
  updated_at: string;
}

export interface KaraokeInstance {
  id: string;
  coordinator_id: string;
  name: string;
  instance_code: string;
  status: 'active' | 'paused' | 'closed';
  created_at: string;
  updated_at: string;
  expires_at?: string;
  coordinator_email?: string;
  video_insertions_enabled: boolean;
  video_insertions_mandatory: boolean;
}

export interface Coordinator {
  id: string;
  email: string;
  role: 'coordinator' | 'admin';
  created_at: string;
  instance?: KaraokeInstance;
}

export type SubscriptionInterest = 'single_event' | 'weekly' | 'monthly' | 'yearly';
export type CoordinatorRequestStatus = 'pending' | 'approved' | 'expired' | 'rejected' | 'duplicado' | 'deleted_by_admin';

export interface CoordinatorRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: SubscriptionInterest;
  status: CoordinatorRequestStatus;
  user_id?: string;
  approved_at?: string;
  approved_by?: string;
  expires_at?: string;
  instance_name?: string;
  temp_password?: string;
  current_password?: string;
  must_change_password?: boolean;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

export const INTEREST_LABELS: Record<SubscriptionInterest, string> = {
  single_event: 'Evento único',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

export const STATUS_LABELS: Record<CoordinatorRequestStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  expired: 'Expirado',
  rejected: 'Rejeitado',
  duplicado: 'Duplicado',
  deleted_by_admin: 'Deletado',
};

export const APPROVAL_DURATIONS = [
  { value: '1h', label: '1 hora (Teste)', hours: 1 },
  { value: '3h', label: '3 horas', hours: 3 },
  { value: '24h', label: '24 horas', hours: 24 },
  { value: '7d', label: '7 dias', hours: 168 },
  { value: '1m', label: '1 mês', hours: 720 },
  { value: '1y', label: '1 ano', hours: 8760 },
];
