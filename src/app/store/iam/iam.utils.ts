import { UserOrganizationEntry } from 'src/app/models/organization-picker.model';

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  if (error && typeof error === 'object') {
    const body = error as Record<string, unknown>;
    const message = body['message'] ?? body['msg'] ?? body['error'];
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return 'Request failed';
}

export function unwrapData<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: T }).data;
    if (data !== undefined) {
      return data;
    }
  }
  return response as T;
}

export function unwrapList<T>(response: unknown): T[] {
  const data = unwrapData<T[] | T>(response);
  if (Array.isArray(data)) {
    return data;
  }
  return data ? [data] : [];
}

export function extractJwt(response: unknown): string | null {
  const data = unwrapData<Record<string, unknown>>(response);
  if (!data || typeof data !== 'object') {
    return null;
  }
  const jwt = data['jwt'] ?? data['token'];
  return typeof jwt === 'string' && jwt ? jwt : null;
}

export function mapUserOrganizationEntries(response: unknown): UserOrganizationEntry[] {
  return unwrapList<Record<string, unknown>>(response)
    .map((entry) => {
      const organization = (entry['organization'] as Record<string, unknown> | undefined) ?? entry;
      const contact = organization['contact'] as Record<string, unknown> | undefined;
      const membership = entry['membership'] as Record<string, unknown> | undefined;
      return {
        id: String(organization['id'] ?? entry['id'] ?? ''),
        name: String(organization['name'] ?? entry['name'] ?? 'Unnamed organization'),
        email: (contact?.['email'] ?? (entry['contact'] as Record<string, unknown> | undefined)?.['email']) as
          | string
          | undefined,
        membershipRole: (membership?.['role'] ?? entry['role'] ?? entry['title']) as string | undefined,
      };
    })
    .filter((entry) => !!entry.id);
}
