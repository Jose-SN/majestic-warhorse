import type { Organization } from 'src/app/models/organization.model';

export interface UserModel {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string; // Used when entity is organization
  profile_image?: string;
  password?: string;
  role?: string;
  contact?: {
    email: string;
    phone?: string;
    [key: string]: any;
  };
  status?: 'pending' | 'active' | 'inactive' | 'suspended';
  app_id?: string;
  organization_id?: string;
  teams?: string[];
  social?: { [key: string]: any };
  date_of_birth?: string;
  about?: string;
  is_imported?: boolean;
  is_password_hashed?: boolean;
  // Legacy fields for backward compatibility (will be mapped from new structure)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  creationDate?: Date;
  modificationDate?: Date;
  jwt?: string;
  assignedTo?: string[];
}

/** Union type for entities that can be either User or Organization */
export type UserOrOrganization = UserModel | Organization;

export function isOrganization(entity: UserOrOrganization | null | undefined): entity is Organization {
  if (entity == null) return false;
  // Organization has `name` as primary; User has `first_name`
  return 'name' in entity && typeof (entity as Organization).name === 'string' &&
    !('first_name' in entity && (entity as UserModel).first_name);
}

export interface UserLoginResponse {
  success?: boolean;
  data: UserModel;
}
export interface UserLogin {
  email: string;
  password: string;
}
