export interface IRegistrationModel {
  firstName: string;
  lastName: string;
  profileImage: string;
  email: string;
  phone?: string;
  role?: string;
  password: string;
  confirmPassword?: string;
}
