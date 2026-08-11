import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { OrganizationListParams } from 'src/app/services/api-service/organization-api.service';
import { Organization, OrganizationCreatePayload } from 'src/app/models/organization.model';
import { UserOrganizationEntry } from 'src/app/models/organization-picker.model';
import { UserLogin, UserModel } from 'src/app/pages/login-page/model/user-model';
import { IPassWordUpdate } from 'src/app/pages/forgot-password/model';
import { IamApplication } from './iam.state';
import {
  IamOrganization,
  OrganizationSyncPayload,
} from 'src/app/core/auth/organization-oauth.service';
import { IamResponse, IamUser, UserSyncPayload } from 'src/app/core/auth/user-oauth.service';

export const IamApplicationActions = createActionGroup({
  source: 'IAM Application',
  events: {
    'Load Applications': emptyProps(),
    'Load Applications Success': props<{ application: IamApplication }>(),
    'Load Applications Failure': props<{ error: string }>(),
  },
});

export const IamAuthActions = createActionGroup({
  source: 'IAM Auth',
  events: {
    'Login User': props<{ credentials: UserLogin }>(),
    'Login User Success': props<{ response: unknown; token: string | null }>(),
    'Login User Failure': props<{ error: string }>(),

    'Load Users': emptyProps(),
    'Load Users Success': props<{ users: UserModel[] }>(),
    'Load Users Failure': props<{ error: string }>(),

    'Load Users By Organization': props<{ organizationId: string }>(),
    'Load Users By Organization Success': props<{ users: UserModel[] }>(),
    'Load Users By Organization Failure': props<{ error: string }>(),

    'Resolve Users For Organization': props<{ organizationId: string; cached: UserModel[] }>(),
    'Resolve Users For Organization Success': props<{ users: UserModel[] }>(),
    'Resolve Users For Organization Failure': props<{ error: string }>(),

    'Load User By Id': props<{ userId: string }>(),
    'Load User By Id Success': props<{ user: UserModel | null }>(),
    'Load User By Id Failure': props<{ error: string }>(),

    'Load User By Email': props<{ email: string }>(),
    'Load User By Email Success': props<{ user: IamUser | null }>(),
    'Load User By Email Failure': props<{ error: string }>(),

    'Save User': props<{ payload: Record<string, unknown> }>(),
    'Save User Success': props<{ user: unknown }>(),
    'Save User Failure': props<{ error: string }>(),

    'Update User': props<{ payload: Record<string, unknown> }>(),
    'Update User Success': props<{ user: unknown }>(),
    'Update User Failure': props<{ error: string }>(),

    'Delete User': props<{ payload: Record<string, unknown> }>(),
    'Delete User Success': emptyProps(),
    'Delete User Failure': props<{ error: string }>(),

    'Update User Password': props<{ payload: IPassWordUpdate }>(),
    'Update User Password Success': props<{ response: unknown }>(),
    'Update User Password Failure': props<{ error: string }>(),

    'Confirm User Password': props<{ payload: IPassWordUpdate }>(),
    'Confirm User Password Success': props<{ response: unknown }>(),
    'Confirm User Password Failure': props<{ error: string }>(),

    'Sync User': props<{ payload: UserSyncPayload }>(),
    'Sync User Success': props<{ response: IamResponse<IamUser> }>(),
    'Sync User Failure': props<{ error: string }>(),
  },
});

export const IamOrganizationActions = createActionGroup({
  source: 'IAM Organization',
  events: {
    'Login Organization': props<{ credentials: { email: string; password: string } }>(),
    'Login Organization Success': props<{ response: unknown; token: string | null }>(),
    'Login Organization Failure': props<{ error: string }>(),

    'Load Organizations': emptyProps(),
    'Load Organizations Success': props<{ organizations: Organization[] }>(),
    'Load Organizations Failure': props<{ error: string }>(),

    'Save Organization': props<{ payload: OrganizationCreatePayload }>(),
    'Save Organization Success': props<{ organization: unknown }>(),
    'Save Organization Failure': props<{ error: string }>(),

    'Update Organization': props<{ payload: Partial<Organization> & { id: string } }>(),
    'Update Organization Success': props<{ organization: unknown }>(),
    'Update Organization Failure': props<{ error: string }>(),

    'Load Organizations For User': props<{ params: OrganizationListParams }>(),
    'Load Organizations For User Success': props<{ organizations: UserOrganizationEntry[] }>(),
    'Load Organizations For User Failure': props<{ error: string }>(),

    'Update Organization Password': props<{ payload: { email: string; password: string } }>(),
    'Update Organization Password Success': props<{ response: unknown }>(),
    'Update Organization Password Failure': props<{ error: string }>(),

    'Confirm Organization Password': props<{
      payload: { email: string; otp: string; password: string };
    }>(),
    'Confirm Organization Password Success': props<{ response: unknown }>(),
    'Confirm Organization Password Failure': props<{ error: string }>(),

    'Load Organization By Email': props<{ email: string }>(),
    'Load Organization By Email Success': props<{ organization: IamOrganization | null }>(),
    'Load Organization By Email Failure': props<{ error: string }>(),

    'Sync Organization': props<{ payload: OrganizationSyncPayload }>(),
    'Sync Organization Success': props<{ response: IamResponse<IamOrganization> }>(),
    'Sync Organization Failure': props<{ error: string }>(),
  },
});
