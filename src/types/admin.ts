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
  coordinator_email?: string;
}

export interface Coordinator {
  id: string;
  email: string;
  role: 'coordinator' | 'admin';
  created_at: string;
  instance?: KaraokeInstance;
}
