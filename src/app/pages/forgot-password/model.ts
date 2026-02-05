export interface IPassWordUpdate {
  email: string;
  password: string;
  otp?: string;
  userId?: string; // Internal use only, not sent to API
}
