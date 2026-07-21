import { EventEmitter, Injectable } from '@angular/core';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { IToasterModel } from '../toaster/toaster.model';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Subject, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TOASTER_MESSAGE_TYPE } from '../toaster/toaster-info';
import { IModelInfo } from 'src/app/components/common-dialog/model/popupmodel';
import { isActiveStatus } from 'src/app/models/user-status.model';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  public loginedUserInfo!: UserModel;
  /** For students: true = has teachers from teacher_students table, false = none, null = not yet checked */
  public hasAssignedTeachers: boolean | null = null;
  public userPermissions: string[] = [];
  private _allUsersList: UserModel[] = [];
  private allUsersList$ = new BehaviorSubject<UserModel[]>([]);
  public adminRoleType: string[] = ['organization', 'teacher'];
  private openpopupModel$: Subject<any> = new Subject<any>();
  private closePopupModel$: Subject<any> = new Subject<any>();
  private commonSearchText: Subject<string> = new BehaviorSubject('');
  public onlineStatusChanged = new EventEmitter<boolean>();
  constructor(private toastrService: ToastrService) {
    this.initializeStatus();
  }
  get allUsersList(): UserModel[] {
    return this._allUsersList;
  }
  set allUsersList(value: UserModel[]) {
    this._allUsersList = value ?? [];
    this.allUsersList$.next(this._allUsersList);
  }
  set alluserList(userList: UserModel[]) {
    this.allUsersList = userList;
  }
  getAllUsersList$() {
    return this.allUsersList$.asObservable();
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

  /** True when session has at least one active/approved course user-role. */
  hasApprovedUserRole(): boolean {
    try {
      const raw = sessionStorage.getItem('userRoles');
      const roles = raw ? (JSON.parse(raw) as Array<{ status?: string }>) : [];
      if (!Array.isArray(roles) || !roles.length) {
        return false;
      }
      return roles.some((role) => isActiveStatus(role.status));
    } catch {
      return false;
    }
  }

  /** Teacher/student waiting on organization approval (no active user-roles). */
  isAwaitingOrganizationApproval(): boolean {
    const role = this.loginedUserInfo?.role || '';
    if (role !== 'teacher' && role !== 'student') {
      return false;
    }
    return !this.hasApprovedUserRole();
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
  decodeUrl(url: string = '') {
    return url.replace(/&#x2F;/g, '/');
    // return new DOMParser().parseFromString(url, "text/html").documentElement.textContent;
  }
  setCommonSearchText(searchText: string) {
    this.commonSearchText.next(searchText);
  }
  getCommonSearchText(){
    return this.commonSearchText.asObservable();
  }
}
