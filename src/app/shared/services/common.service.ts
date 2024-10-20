import { Injectable } from '@angular/core';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { IToasterModel } from '../toaster/toaster.model';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TOASTER_MESSAGE_TYPE } from '../toaster/toaster-info';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  public loginedUserInfo!: UserModel;
  public adminRoleType: string = 'admin';
  constructor(private toastrService: ToastrService) {}

  openToaster(toasterData: IToasterModel) {
    const commonConfig = {
      timeOut: 5000,
    };
    switch (toasterData.messageType) {
      case TOASTER_MESSAGE_TYPE.SUCCESS:
        this.toastrService.success(toasterData.message, '', commonConfig);
        break;
      case TOASTER_MESSAGE_TYPE.WARNING:
        this.toastrService.warning(toasterData.message, '', commonConfig);
        break;
      case TOASTER_MESSAGE_TYPE.ERROR:
        this.toastrService.error(toasterData.message, '', commonConfig);
        break;
      case TOASTER_MESSAGE_TYPE.INFO:
        this.toastrService.info(toasterData.message, '', commonConfig);
        break;
    }
  }
  public handleError(errorHandler: HttpErrorResponse) {
    debugger;
    return throwError(() => errorHandler.error);
  }
  public isEmpty(object: { [key: string]: string | number }) {
    return Object.keys(object).length === 0;
  }
  public isEmpty(object: { [key: string]: string | number }) {
    return Object.keys(object).length === 0;
  }
}
