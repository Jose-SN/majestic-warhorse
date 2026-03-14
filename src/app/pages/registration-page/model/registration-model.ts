import type { OrganizationContact } from 'src/app/models/organization.model';

export interface IRegistrationModel {
  firstName?: string;
  lastName?: string;
  profileImage: string;
  email?: string;
  phone?: string;
  role?: string;
  password: string;
  confirmPassword?: string;
  registrationType?: 'user' | 'organization';
  /** Organization name - required when role is organization */
  name?: string;
  contact?: OrganizationContact;
  app_id?: string;
  organization_id?: string;
}
