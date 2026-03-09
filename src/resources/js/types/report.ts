export interface ReportAction {
  id: number;
  admin: { id: number; name: string } | null;
  action: string;
  note: string | null;
  created_at: string;
}

export interface AdminReport {
  id: number;
  reporter: { id: number; name: string } | null;
  target_user: { id: number; name: string } | null;
  reason: string;
  status: 'pending' | 'resolved';
  admin_note: string | null;
  resolver: { id: number; name: string } | null;
  actions: ReportAction[];
  created_at: string;
}
