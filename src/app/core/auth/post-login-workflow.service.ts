import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UserRoleOverview } from 'src/app/models/roster.model';
import { isActiveStatus, isPendingStatus, normalizeUserStatus } from 'src/app/models/user-status.model';
import { UserOrganizationEntry } from 'src/app/models/organization-picker.model';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { UserRoleApiService } from 'src/app/services/api-service/user-role-api.service';
import { AssignTeacherService } from 'src/app/components/assign-teachers/assign-teacher.service';
import { RosterRegistrationService } from 'src/app/services/api-service/roster-registration.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { mapOrganizationToUserShape, mapUserToLegacy } from 'src/app/shared/utils/user-mapper.util';

export type LoginType = 'user' | 'organization';
export type RoleIntent = 'teacher' | 'student';

export interface LoginSessionInput {
  jwt: string;
  loginType: LoginType;
  profile: Record<string, unknown>;
  authProvider?: 'password' | 'google';
  roleIntent?: RoleIntent;
}

@Injectable({ providedIn: 'root' })
export class PostLoginWorkflowService {
  constructor(
    private router: Router,
    private commonService: CommonService,
    private authService: AuthService,
    private organizationApiService: OrganizationApiService,
    private userRoleApi: UserRoleApiService,
    private assignTeacherService: AssignTeacherService,
    private rosterRegistration: RosterRegistrationService
  ) {}

  /** Run the full post-login workflow per UI_WORKFLOW.md Flow 0 + 0b. */
  async completeLogin(input: LoginSessionInput): Promise<void> {
    const { jwt, loginType, profile, authProvider = 'password', roleIntent } = input;

    if (loginType === 'organization') {
      this.persistOrganizationSession(jwt, profile, authProvider);
      await this.authService.getAllUsers().then((users) => {
        this.commonService.allUsersList = users || [];
      }).catch(() => {});
      this.router.navigate(['/dashboard']);
      return;
    }

    const mappedUser = mapUserToLegacy({ ...profile, jwt } as UserModel);
    this.persistUserSession(jwt, mappedUser, authProvider, loginType);

    const organizations = await this.fetchUserOrganizations(
      mappedUser.id,
      mappedUser.email || mappedUser.contact?.email
    );

    const organizationId = mappedUser.organization_id || '';
    if (organizationId && mappedUser.id) {
      const overview = await firstValueFrom(
        this.userRoleApi.getOverview(organizationId, mappedUser.id)
      ).catch(() => null);

      const hasTeacherOrStudent = (overview?.roles ?? []).some(
        (role) => role.role_code === 'teacher' || role.role_code === 'student'
      );

      if (hasTeacherOrStudent) {
        sessionStorage.setItem('organization_id', organizationId);
        const org = organizations.find((entry) => entry.id === organizationId);
        if (org?.name) {
          sessionStorage.setItem('activeOrganizationName', org.name);
        }
        sessionStorage.removeItem('needsOrgPicker');
        const finalOverview = await this.continueWithOrganization(
          mappedUser,
          organizationId
        );
        await this.routeUserByRoles(mappedUser, finalOverview, organizationId);
        return;
      }
    }

    sessionStorage.setItem('pendingUserOrganizations', JSON.stringify(organizations));
    sessionStorage.setItem('needsOrgPicker', 'true');
    if (roleIntent) {
      sessionStorage.setItem('pendingRoleIntent', roleIntent);
    }
    this.router.navigate(['/org-picker']);
  }

  /** Called from org picker after the user selects an organization and role. */
  async selectOrganization(
    organizationId: string,
    options: { skipRouting?: boolean; roleIntent?: RoleIntent } = {}
  ): Promise<void> {
    const user = this.commonService.loginedUserInfo;
    if (!user?.id) {
      throw new Error('User session expired. Please sign in again.');
    }

    sessionStorage.setItem('organization_id', organizationId);
    user.organization_id = organizationId;
    sessionStorage.setItem('login_details', JSON.stringify(user));
    this.commonService.loginedUserInfo = user;

    const intent =
      options.roleIntent ||
      (sessionStorage.getItem('pendingRoleIntent') as RoleIntent | null) ||
      undefined;
    sessionStorage.removeItem('pendingRoleIntent');
    sessionStorage.removeItem('pendingOrganizationId');
    sessionStorage.removeItem('pendingUserOrganizations');
    sessionStorage.removeItem('needsOrgPicker');

    await this.syncUserOrganization(user, organizationId);

    const overview = await this.continueWithOrganization(user, organizationId, intent ?? undefined);

    if (options.skipRouting) {
      return;
    }

    await this.routeUserByRoles(user, overview, organizationId);
  }

  private async continueWithOrganization(
    mappedUser: UserModel,
    organizationId: string,
    roleIntent?: RoleIntent
  ): Promise<UserRoleOverview | null> {
    sessionStorage.setItem('organization_id', organizationId);
    mappedUser.organization_id = organizationId;

    this.persistActiveOrganizationName(organizationId);

    sessionStorage.removeItem('pendingRoleIntent');
    sessionStorage.removeItem('pendingOrganizationId');
    sessionStorage.removeItem('pendingUserOrganizations');

    const userId = mappedUser.id ?? '';
    let overview = await firstValueFrom(
      this.userRoleApi.getOverview(organizationId, userId)
    ).catch(() => null);

    if (!overview?.roles?.length && roleIntent) {
      await this.registerOnRoster(roleIntent, organizationId, userId, mappedUser);
      overview = await firstValueFrom(
        this.userRoleApi.getOverview(organizationId, userId)
      ).catch(() => null);
      // Roster may not return a role until org approval — keep intended role for limited access
      if (!overview?.roles?.length) {
        mappedUser.role = roleIntent;
        mappedUser.status = 'active';
      }
    }

    this.applyRoleOverview(mappedUser, overview);
    sessionStorage.setItem('login_details', JSON.stringify(mappedUser));
    this.commonService.loginedUserInfo = mappedUser;

    await this.authService.getAllUsers().then((users) => {
      this.commonService.allUsersList = users || [];
    }).catch(() => {});

    await this.loadUserPermissions(organizationId, userId);

    return overview;
  }

  private async loadUserPermissions(organizationId: string, userId: string): Promise<void> {
    try {
      const permissions = await firstValueFrom(
        this.userRoleApi.getPermissions(organizationId, userId)
      );
      sessionStorage.setItem('userPermissions', JSON.stringify(permissions));
      this.commonService.userPermissions = permissions;
    } catch {
      sessionStorage.setItem('userPermissions', JSON.stringify([]));
      this.commonService.userPermissions = [];
    }
  }

  async hasCourseRoles(organizationId?: string): Promise<boolean> {
    const user = this.commonService.loginedUserInfo;
    const orgId =
      organizationId ||
      sessionStorage.getItem('organization_id') ||
      user?.organization_id ||
      '';
    if (!user?.id || !orgId) return false;

    const overview = await firstValueFrom(
      this.userRoleApi.getOverview(orgId, user.id)
    ).catch(() => null);
    return (overview?.roles?.length ?? 0) > 0;
  }

  async continueRoutingForCurrentUser(): Promise<void> {
    const user = this.commonService.loginedUserInfo;
    const organizationId =
      sessionStorage.getItem('organization_id') || user?.organization_id || '';
    if (!user?.id || !organizationId) {
      this.router.navigate(['/login']);
      return;
    }

    const overview = await firstValueFrom(
      this.userRoleApi.getOverview(organizationId, user.id)
    ).catch(() => null);
    this.applyRoleOverview(user, overview);
    sessionStorage.setItem('login_details', JSON.stringify(user));
    this.commonService.loginedUserInfo = user;
    await this.routeUserByRoles(user, overview, organizationId);
  }

  /** Self-join as teacher or student (Flow E / Flow I). */
  async joinOrganization(role: RoleIntent): Promise<void> {
    const user = this.commonService.loginedUserInfo;
    const orgId = sessionStorage.getItem('organization_id') || user?.organization_id || '';
    if (!orgId || !user?.id) {
      throw new Error('Missing organization or user context.');
    }
    await this.registerOnRoster(role, orgId, user.id, user);
    const overview = await firstValueFrom(this.userRoleApi.getOverview(orgId, user.id));
    this.applyRoleOverview(user, overview);
    if (!overview?.roles?.length) {
      user.role = role;
      user.status = 'active';
    }
    sessionStorage.setItem('login_details', JSON.stringify(user));
    this.commonService.loginedUserInfo = user;
    await this.routeUserByRoles(user, overview, orgId);
  }

  private async syncUserOrganization(user: UserModel, organizationId: string): Promise<void> {
    user.organization_id = organizationId;
    try {
      await firstValueFrom(
        this.authService.updateUserInfo({
          id: user.id,
          organization_id: organizationId,
        })
      );
    } catch {
      // Local session is still updated even if IAM sync fails.
    }
    sessionStorage.setItem('login_details', JSON.stringify(user));
    this.commonService.loginedUserInfo = user;
  }

  private persistActiveOrganizationName(organizationId: string): void {
    try {
      const pending = sessionStorage.getItem('pendingUserOrganizations');
      if (pending) {
        const orgs = JSON.parse(pending) as Array<{ id: string; name: string }>;
        const match = orgs.find((o) => o.id === organizationId);
        if (match?.name) {
          sessionStorage.setItem('activeOrganizationName', match.name);
          return;
        }
      }
    } catch {
      // ignore
    }
  }

  private resolveStoredOrganizationId(
    user: UserModel,
    organizations: UserOrganizationEntry[]
  ): string {
    const pendingOrg = sessionStorage.getItem('pendingOrganizationId');
    if (pendingOrg) return pendingOrg;
    if (user.organization_id) return user.organization_id;
    const sessionOrg = sessionStorage.getItem('organization_id');
    if (sessionOrg && organizations.some((o) => o.id === sessionOrg)) {
      return sessionOrg;
    }
    if (organizations.length === 1) {
      return organizations[0].id;
    }
    return '';
  }

  private async fetchUserOrganizations(userId?: string, email?: string): Promise<UserOrganizationEntry[]> {
    try {
      const res: any = await firstValueFrom(
        this.organizationApiService.listOrganizationsForUser({ userId, email })
      );
      const data = res?.data ?? res ?? [];
      const list = Array.isArray(data) ? data : [];
      return list
        .map((entry: any) => ({
          id: entry.organization?.id ?? entry.id ?? '',
          name: entry.organization?.name ?? entry.name ?? 'Unnamed organization',
          email: entry.organization?.contact?.email ?? entry.contact?.email,
          membershipRole: entry.membership?.role ?? entry.role,
        }))
        .filter((o: UserOrganizationEntry) => !!o.id);
    } catch {
      return [];
    }
  }

  private async registerOnRoster(
    role: RoleIntent,
    organizationId: string,
    userId: string,
    user: UserModel
  ): Promise<void> {
    await this.rosterRegistration.registerOnRoster({
      organizationId,
      role,
      userId,
      email: user.email || user.contact?.email || '',
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      phone: user.phone || user.contact?.phone || '',
      status: 'pending',
    });
  }

  private applyRoleOverview(user: UserModel, overview: UserRoleOverview | null): void {
    const roles = overview?.roles ?? [];
    sessionStorage.setItem('userRoles', JSON.stringify(roles));

    const active = roles.filter((r) => isActiveStatus(r.status));
    const pending = roles.filter((r) => isPendingStatus(r.status));
    const suspended = roles.filter((r) => normalizeUserStatus(r.status) === 'suspended');
    const rejected = roles.filter((r) => normalizeUserStatus(r.status) === 'rejected');
    const deleted = roles.filter((r) => normalizeUserStatus(r.status) === 'deleted');

    if (deleted.length && !active.length) {
      user.status = 'deleted';
      user.role = deleted[0].role_code;
      return;
    }

    if (rejected.length && !active.length && !pending.length) {
      user.status = 'rejected';
      user.role = rejected[0].role_code;
      return;
    }

    if (suspended.length && !active.length) {
      user.status = 'suspended';
      user.role = suspended[0].role_code;
      return;
    }

    const primary =
      active.find((r) => r.role_code === 'teacher') ||
      active.find((r) => r.role_code === 'student') ||
      pending.find((r) => r.role_code === 'teacher') ||
      pending.find((r) => r.role_code === 'student') ||
      roles[0];

    if (primary) {
      user.role = primary.role_code;
      // IAM account stays active; gating is based on user_roles existing
      user.status = 'active';
    }
  }

  private async routeUserByRoles(
    user: UserModel,
    overview: UserRoleOverview | null,
    organizationId: string
  ): Promise<void> {
    const roles = overview?.roles ?? [];

    // No course user roles yet — teachers/students can browse public courses with a banner
    if (!roles.length) {
      if (user.role === 'teacher' || user.role === 'student') {
        if (user.role === 'student') {
          const studentId = user.id ?? '';
          try {
            const res: any = await firstValueFrom(
              this.assignTeacherService.getAssignedTeachers(studentId, organizationId)
            );
            const data = res?.data ?? res;
            const list = Array.isArray(data) ? data : [];
            this.commonService.hasAssignedTeachers = list.length > 0;
          } catch {
            this.commonService.hasAssignedTeachers = false;
          }
        }
        this.router.navigate(['/dashboard']);
        return;
      }
      this.router.navigate(['/dashboard/approval-pending'], {
        state: {
          infoMessage:
            'Your request is pending approval from your organization. Please reach out to your organization for assistance.',
        },
      });
      return;
    }

    if (user.status === 'deleted') {
      this.router.navigate(['/dashboard/approval-pending'], {
        state: {
          infoMessage: 'Your account has been deleted. Please contact your organization.',
        },
      });
      return;
    }

    if (user.status === 'rejected') {
      this.router.navigate(['/dashboard/approval-pending'], {
        state: {
          infoMessage: 'Your access request was rejected. Please contact your organization.',
        },
      });
      return;
    }

    if (user.status === 'suspended') {
      this.router.navigate(['/dashboard/approval-pending'], {
        state: {
          infoMessage: 'Your account has been suspended. Please contact your organization.',
        },
      });
      return;
    }

    if (user.role === 'student') {
      const studentId = user.id ?? '';
      try {
        const res: any = await firstValueFrom(
          this.assignTeacherService.getAssignedTeachers(studentId, organizationId)
        );
        const data = res?.data ?? res;
        const list = Array.isArray(data) ? data : [];
        this.commonService.hasAssignedTeachers = list.length > 0;
      } catch {
        this.commonService.hasAssignedTeachers = false;
      }
    }

    this.router.navigate(['/dashboard']);
  }

  private persistUserSession(
    jwt: string,
    user: UserModel,
    authProvider: string,
    accountLoginType: LoginType = 'user'
  ): void {
    this.authService.setLogin = true;
    sessionStorage.setItem('authToken', jwt);
    sessionStorage.setItem('token', jwt);
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('authProvider', authProvider);
    sessionStorage.setItem('login_details', JSON.stringify(user));
    sessionStorage.setItem('loginType', accountLoginType);
    if (user.organization_id) {
      sessionStorage.setItem('organization_id', user.organization_id);
    }
    this.commonService.loginedUserInfo = user;
  }

  private persistOrganizationSession(
    jwt: string,
    profile: Record<string, unknown>,
    authProvider: string
  ): void {
    const mappedOrg = mapOrganizationToUserShape({ ...profile, jwt });
    this.authService.setLogin = true;
    sessionStorage.setItem('authToken', jwt);
    sessionStorage.setItem('token', jwt);
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('authProvider', authProvider);
    sessionStorage.setItem('loginType', 'organization');
    sessionStorage.setItem('organization_id', mappedOrg.id ?? '');
    sessionStorage.setItem('login_details', JSON.stringify(mappedOrg));
    sessionStorage.setItem('userRoles', JSON.stringify([]));
    this.commonService.loginedUserInfo = mappedOrg;
  }
}
