import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { UserLogin, UserModel } from './model/user-model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private allUsersList: UserModel[] = [];
  constructor(private authService: AuthService, private router: Router) {}
  async getAllUsers() {
    this.allUsersList = await this.authService.getAllUsers();
  }
  public userLogin(loginInfo: UserLogin) {
    const userExist = this.allUsersList.find((user: UserModel) => {
      return (
        user.email === loginInfo.email &&
        loginInfo.password === '' + user.password
      );
    });
    if (userExist) {
      this.authService.setLogin = true;
      this.router.navigate(['/userdashboard']);
    } else {
      this.authService.setLogin = false;
    }
  }
}
