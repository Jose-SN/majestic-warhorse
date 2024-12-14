export interface UserModel {
  id: string;
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  password?: string;
  role?: string;
  creationDate: Date;
  modificationDate: Date;
  jwt: string;
  phone?: string;
  profileImage?:string;
  assignedTo?:string[];
  approved?:boolean;
}
export interface UserLoginResponse {
  success?: boolean;
  data: UserModel;
}
export interface UserLogin {
  email: string;
  password: string;
}
