export type Status = 'New' | 'In Progress' | 'Resolved';

export interface Inquiry {
  id: number;
  customer_name: string;
  contact: string;
  subject: string;
  description: string;
  status: Status;
  created_by: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export const NEXT_STATUSES: Record<Status, Status[]> = {
  New: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['In Progress'],
};