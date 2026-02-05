export interface IRegistrationModel {
  firstName?: string;
  lastName?: string;
  profileImage: string;
  email?: string;
  phone?: string;
  role?: string;
  password: string;
  confirmPassword?: string;
  // Organization fields
  registrationType?: 'user' | 'organization';
  name?: string; // For organization
  contact?: {
    email?: string;
    phone?: string;
  };
  app_id?: string; // UUID for organization
}
