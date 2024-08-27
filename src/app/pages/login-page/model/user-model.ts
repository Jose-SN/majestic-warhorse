export interface UserModel {
  email: string;
  fname: string;
  lname: string;
  password: number | string;
  phone: string;
  role?: string;
}
export interface UserLogin {
  email: string;
  password: string;
}
