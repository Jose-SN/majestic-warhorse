import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { UserLogin, UserModel } from './model/user-model';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private allUsersList: UserModel[] = [];
  constructor(
    private authService: AuthService,
    private router: Router,
    private commonService: CommonService
  ) {}
  async getAllUsers() {
    this.allUsersList = await this.authService.getAllUsers();
  }
  public userLogin(loginInfo: UserLogin) {
    this.authService.loginUser(loginInfo).subscribe({
      next: (userExist) => {
        if (userExist) {
          this.authService.setLogin = true;
          this.router.navigate(['/dashboard']);
          this.commonService.loginedUserInfo = userExist;
        } else {
          this.loginUserFailed();
        }
      },
      error: () => {
        this.loginUserFailed();
      },
    });
  }
  private loginUserFailed() {
    this.commonService.openToaster({
      message: 'Please verify login credential',
      messageType: TOASTER_MESSAGE_TYPE.ERROR,
    });
    this.authService.setLogin = false;
  }
}
