import { UserOrganizationEntry } from 'src/app/models/organization-picker.model';
import { Organization } from 'src/app/models/organization.model';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { IamOrganization } from 'src/app/core/auth/organization-oauth.service';
import { IamUser } from 'src/app/core/auth/user-oauth.service';

export const IAM_FEATURE_KEY = 'iam';

export interface IamApplication {
  id: string;
  client_id?: string;
  [key: string]: unknown;
}

export interface IamState {
  application: IamApplication | null;
  appId: string | null;
  clientId: string | null;

  users: UserModel[];
  selectedUser: UserModel | IamUser | null;
  organizations: Organization[];
  userOrganizations: UserOrganizationEntry[];
  selectedOrganization: IamOrganization | null;
  token: string | null;

  loadingApplication: boolean;
  loadingLogin: boolean;
  loadingUsers: boolean;
  loadingOrganizations: boolean;
  loadingUserOrganizations: boolean;
  savingUser: boolean;
  savingOrganization: boolean;
  updatingUser: boolean;
  updatingOrganization: boolean;
  deletingUser: boolean;
  updatingPassword: boolean;
  confirmingPassword: boolean;
  syncing: boolean;
  error: string | null;
}

export const initialIamState: IamState = {
  application: null,
  appId: null,
  clientId: null,
  users: [],
  selectedUser: null,
  organizations: [],
  userOrganizations: [],
  selectedOrganization: null,
  token: null,
  loadingApplication: false,
  loadingLogin: false,
  loadingUsers: false,
  loadingOrganizations: false,
  loadingUserOrganizations: false,
  savingUser: false,
  savingOrganization: false,
  updatingUser: false,
  updatingOrganization: false,
  deletingUser: false,
  updatingPassword: false,
  confirmingPassword: false,
  syncing: false,
  error: null,
};
