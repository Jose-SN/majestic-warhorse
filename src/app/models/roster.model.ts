import type { UserStatus } from './user-status.model';

export type RosterStatus = UserStatus;

export interface RosterRow {
  id: string;
  organization_id: string;
  user_id: string;
  status: RosterStatus;
  role_code?: 'teacher' | 'student' | 'org_admin';
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface UserRoleEntry {
  id: string;
  role_code: string;
  status: RosterStatus;
}

export interface UserRoleOverview {
  organization_id: string;
  user_id: string;
  roles: UserRoleEntry[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination?: { limit: number; offset: number; total: number };
}

export interface CourseApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: unknown;
}
