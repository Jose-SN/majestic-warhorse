import { EventEmitter, Injectable } from '@angular/core';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { IToasterModel } from '../toaster/toaster.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TOASTER_MESSAGE_TYPE } from '../toaster/toaster-info';
import { IModelInfo } from 'src/app/components/common-dialog/model/popupmodel';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  public loginedUserInfo!: UserModel;
  public allUsersList: UserModel[] = [];
  public adminRoleType: string[] = ['admin', 'teacher'];
  private openpopupModel$: Subject<any> = new Subject<any>();
  private closePopupModel$: Subject<any> = new Subject<any>();
  public onlineStatusChanged = new EventEmitter<boolean>();
  constructor(private toastrService: ToastrService) {
    this.initializeStatus();
  }
  set alluserList(userList: UserModel[]) {
    this.allUsersList = userList;
  }
  public openToaster(toasterData: IToasterModel) {
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
    return throwError(() => errorHandler.error);
  }
  public isEmpty(object: { [key: string]: string | number }) {
    return Object.keys(object).length === 0;
  }
  public openPopupModel(modalInfo: IModelInfo) {
    this.openpopupModel$.next(modalInfo);
  }
  public getOpenpopupModelHandle() {
    return this.openpopupModel$.asObservable();
  }
  public closePopupModel(close: boolean) {
    this.closePopupModel$.next(close);
  }
  public closePopupModelHandle() {
    return this.closePopupModel$.asObservable();
  }
  transformText(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private initializeStatus() {
    // Emit the current status on service initialization
    this.emitOnlineStatus();
    // Listen for online and offline events
    window.addEventListener('online', () => this.emitOnlineStatus());
    window.addEventListener('offline', () => this.emitOnlineStatus());
  }
  private emitOnlineStatus() {
    this.onlineStatusChanged.emit(navigator.onLine);
  }
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${this.paddingZero(hours)}:${this.paddingZero(minutes)}:${this.paddingZero(remainingSeconds)}`;
  }
  paddingZero(number: number): string {
    return number < 10 ? `0${number}` : `${number}`;
  }
}
