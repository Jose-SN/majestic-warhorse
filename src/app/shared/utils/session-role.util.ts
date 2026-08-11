/** Session login roles accepted by Logic library + chat APIs. */
export type AppSessionRole = 'organization' | 'teacher' | 'student';

/**
 * Normalize login/session role for Logic APIs that require
 * `role: organization | teacher | student` (library upload/list, chat ask).
 */
export function resolveSessionRole(
  rawRole?: string | null,
  loginType?: string | null
): AppSessionRole {
  const login = (loginType || '').toLowerCase().trim();
  if (login === 'organization') {
    return 'organization';
  }

  const role = (rawRole || '').toLowerCase().trim();
  if (role === 'organization' || role === 'org_admin' || role === 'admin') {
    return 'organization';
  }
  if (role === 'teacher') {
    return 'teacher';
  }
  if (role === 'student') {
    return 'student';
  }
  // loginType "user" without a roster role — default student
  return 'student';
}
