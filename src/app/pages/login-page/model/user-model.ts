export interface UserModel {
  email: string;
  fname: string;
  lname: string;
  phone: string;
  role?: string;
  password: number | string;
}
export interface UserLoginResponse {
  success?: boolean;
  data: UserModel;
}
export interface UserLogin {
  email: string;
  password: string;
}
