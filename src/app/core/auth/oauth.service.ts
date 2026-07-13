import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { IamUser, UserOAuthService, UserSyncPayload } from './user-oauth.service';
import {
  IamOrganization,
  OrganizationOAuthService,
  OrganizationSyncPayload,
} from './organization-oauth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { PostLoginWorkflowService } from './post-login-workflow.service';
import { AppContextService } from '../app-context.service';
import { environment } from 'src/environments/environment';

type LoginType = 'user' | 'organization';

@Injectable({
  providedIn: 'root',
})
export class OAuthService {
  /** Guards against double execution of the callback exchange */
  private callbackHandled = false;

  constructor(
    private supabaseService: SupabaseService,
    private userOAuthService: UserOAuthService,
    private organizationOAuthService: OrganizationOAuthService,
    private postLoginWorkflow: PostLoginWorkflowService,
    private appContext: AppContextService,
    private commonService: CommonService,
    private router: Router
  ) {}

  /** Preserve app_id while clearing any previous IAM session state. */
  private clearIamSessionKeepAppId(): void {
    const appId = sessionStorage.getItem('app_id');
    const application = sessionStorage.getItem('application');
    const clientId = sessionStorage.getItem('client_id');
    ['authToken', 'token', 'login_details', 'user', 'loginType', 'isAuthenticated',
     'authProvider', 'organization_id', 'userRoles'].forEach((key) =>
      sessionStorage.removeItem(key)
    );
    if (appId) sessionStorage.setItem('app_id', appId);
    if (application) sessionStorage.setItem('application', application);
    if (clientId) sessionStorage.setItem('client_id', clientId);
  }

  /** Start the Google OAuth (PKCE) redirect flow for a user or organization sign-in. */
  async signInWithGoogle(loginType: LoginType = 'user'): Promise<void> {
    await this.appContext.ensureAppId();

    sessionStorage.setItem('loginType', loginType);
    sessionStorage.setItem('socialAuthMode', 'signin');
    sessionStorage.setItem('socialProvider', 'google');
    localStorage.setItem('pendingSocialLoginType', loginType);
    localStorage.setItem('pendingSocialAuthMode', 'signin');

    this.clearIamSessionKeepAppId();
    sessionStorage.setItem('loginType', loginType);

    const { data, error } = await this.supabaseService.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${environment.appUrl}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (error || !data?.url) {
      throw new Error(error?.message || 'Unable to start Google sign-in.');
    }
    window.location.assign(data.url);
  }

  /**
   * Handle the OAuth return: exchange code -> supabase session,
   * sync with IAM, persist JWT session, and redirect to dashboard.
   */
  async handleGoogleCallback(): Promise<void> {
    if (this.callbackHandled) return;
    this.callbackHandled = true;

    await this.appContext.ensureAppId();

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      throw new Error('Missing authorization code in callback URL.');
    }

    const { data: exchangeData, error: exchangeError } =
      await this.supabaseService.client.auth.exchangeCodeForSession(code);
    if (exchangeError || !exchangeData?.session) {
      throw new Error(exchangeError?.message || 'Failed to complete Google sign-in.');
    }

    const session = exchangeData.session;
    const supaUser = session.user;
    const meta: any = supaUser.user_metadata ?? {};

    const email: string = supaUser.email ?? meta.email ?? '';
    const fullName: string = meta.full_name ?? meta.name ?? '';
    const [firstName, ...rest] = fullName.trim().split(' ');
    const lastName = rest.join(' ');
    const googleId: string = meta.provider_id ?? meta.sub ?? supaUser.id;
    const supabaseUserId: string = supaUser.id;
    const accessToken: string = session.access_token;
    const avatarUrl: string = meta.avatar_url ?? meta.picture ?? '';

    if (!email) {
      throw new Error('Google account did not return an email address.');
    }

    const loginType: LoginType =
      (sessionStorage.getItem('loginType') as LoginType) ||
      (localStorage.getItem('pendingSocialLoginType') as LoginType) ||
      'user';

    const googleContext = {
      firstName: firstName || '',
      lastName: lastName || '',
      fullName,
      email,
      avatarUrl,
      supabaseUserId,
      googleId,
      accessToken,
    };

    if (loginType === 'organization') {
      await this.completeOrganizationSignIn(googleContext);
    } else {
      await this.completeUserSignIn(googleContext);
    }
  }

  /** user/get -> (if missing) user/sync -> persist session. */
  private async completeUserSignIn(ctx: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string;
    supabaseUserId: string;
    googleId: string;
    accessToken: string;
  }): Promise<void> {
    // 1. Check whether the user already exists on the IAM backend.
    let iamUser: IamUser | null = await this.userOAuthService.getUserByEmail(ctx.email);

    // 2. If not found, create the user via user/sync (find-or-create).
    if (!iamUser) {
      const payload: UserSyncPayload = {
        first_name: ctx.firstName,
        last_name: ctx.lastName,
        contact: { email: ctx.email },
        profile_image: ctx.avatarUrl,
        role: 'member',
        status: 'active',
        additional_information: {
          auth_provider: 'google',
          mode: 'signin',
          login_type: 'user',
          supabase_user_id: ctx.supabaseUserId,
          google_id: ctx.googleId,
          access_token: ctx.accessToken,
        },
      };

      const syncResponse = await this.userOAuthService.syncUser(payload);
      if (!syncResponse?.success) {
        throw new Error(syncResponse?.message || 'Failed to sync your account. Please try again.');
      }

      iamUser = syncResponse.data ?? null;
      // user/sync may only echo { id, status }; re-fetch the full profile.
      if (!iamUser?.contact?.email) {
        iamUser = (await this.userOAuthService.getUserByEmail(ctx.email)) ?? iamUser;
      }
    }

    const user: IamUser = iamUser ?? { contact: { email: ctx.email } };
    const jwt = user.jwt ?? ctx.accessToken;
    const roleIntent = sessionStorage.getItem('pendingRoleIntent') as 'teacher' | 'student' | null;

    await this.postLoginWorkflow.completeLogin({
      jwt,
      loginType: 'user',
      profile: user as Record<string, unknown>,
      authProvider: 'google',
      roleIntent: roleIntent ?? undefined,
    });
  }

  /** organization/get -> (if missing) organization/sync -> persist session. */
  private async completeOrganizationSignIn(ctx: {
    fullName: string;
    email: string;
    avatarUrl: string;
    supabaseUserId: string;
    googleId: string;
    accessToken: string;
  }): Promise<void> {
    // 1. Check whether the organization already exists on the IAM backend.
    let iamOrg: IamOrganization | null =
      await this.organizationOAuthService.getOrganizationByEmail(ctx.email);

    // 2. If not found, create the organization via organization/sync.
    if (!iamOrg) {
      const payload: OrganizationSyncPayload = {
        name: ctx.fullName || ctx.email,
        contact: { email: ctx.email },
        profile_image: ctx.avatarUrl,
        additional_information: {
          auth_provider: 'google',
          mode: 'signin',
          login_type: 'organization',
          supabase_user_id: ctx.supabaseUserId,
          google_id: ctx.googleId,
          access_token: ctx.accessToken,
        },
      };

      const syncResponse = await this.organizationOAuthService.syncOrganization(payload);
      if (!syncResponse?.success) {
        throw new Error(
          syncResponse?.message || 'Failed to sync your organization. Please try again.'
        );
      }

      iamOrg = syncResponse.data ?? null;
      // organization/sync may only echo minimal fields; re-fetch the full profile.
      if (!iamOrg?.contact?.email) {
        iamOrg = (await this.organizationOAuthService.getOrganizationByEmail(ctx.email)) ?? iamOrg;
      }
    }

    const org: IamOrganization = iamOrg ?? { contact: { email: ctx.email } };
    const jwt = org.jwt ?? ctx.accessToken;

    await this.postLoginWorkflow.completeLogin({
      jwt,
      loginType: 'organization',
      profile: org as Record<string, unknown>,
      authProvider: 'google',
    });
  }

  /** Sign out of Supabase and clear the app session (keeps app_id). */
  async logout(): Promise<void> {
    try {
      await this.supabaseService.client.auth.signOut();
    } catch {
      // ignore sign-out errors, still clear local session
    }
    const appId = sessionStorage.getItem('app_id');
    const application = sessionStorage.getItem('application');
    const clientId = sessionStorage.getItem('client_id');
    sessionStorage.clear();
    if (appId) sessionStorage.setItem('app_id', appId);
    if (application) sessionStorage.setItem('application', application);
    if (clientId) sessionStorage.setItem('client_id', clientId);
    this.commonService.loginedUserInfo = undefined as any;
    this.router.navigate(['/login']);
  }
}
