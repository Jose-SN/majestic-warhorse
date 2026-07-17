/** Valid IAM / roster user statuses. */
export type UserStatus = 'pending' | 'active' | 'suspended' | 'deleted' | 'rejected';

export const USER_STATUSES: readonly UserStatus[] = [
  'pending',
  'active',
  'suspended',
  'deleted',
  'rejected',
] as const;

/** Map legacy API values to the current status vocabulary. */
export function normalizeUserStatus(status?: string | null): UserStatus | undefined {
  if (!status) return undefined;
  const normalized = status.toLowerCase();
  if (normalized === 'approved' || normalized === 'inactive') {
    return 'active';
  }
  if ((USER_STATUSES as readonly string[]).includes(normalized)) {
    return normalized as UserStatus;
  }
  return undefined;
}

export function isActiveStatus(status?: string | null): boolean {
  return normalizeUserStatus(status) === 'active';
}

export function isPendingStatus(status?: string | null): boolean {
  return normalizeUserStatus(status) === 'pending';
}
