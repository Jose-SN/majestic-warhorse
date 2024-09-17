import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToasterComponent } from '../toaster/toaster.component';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { IToasterModel } from '../toaster/toaster.model';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  public loginedUserInfo!: UserModel;
  constructor(private SnackBar: MatSnackBar) {}

  openToaster(toasterData: IToasterModel) {
    return this.SnackBar.openFromComponent(ToasterComponent, {
      duration: 9000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      data: {
        timeoutInSeconds: 5000,
        ...toasterData,
      },
    });
  }
  public handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = `Server error (${error.status}): ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
