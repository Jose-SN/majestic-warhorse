import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { CommonService } from '../shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from '../shared/toaster/toaster-info';
import { AuthService } from '../services/api-service/auth.service';
@Injectable()
export class HeaderInterceptors implements HttpInterceptor {
  constructor(private commonService: CommonService, private authService: AuthService) {}
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token: string | null = sessionStorage.getItem('authToken');
    const appId: string | null = sessionStorage.getItem('app_id');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (appId) {
      headers['x-app-id'] = appId;
    }
    const clonedRequest = Object.keys(headers).length > 0
      ? req.clone({ setHeaders: headers })
      : req;
    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.logOutApplication();
          // this.commonService.openToaster({
          //   message: `${error?.error?.msg} Please log in again.`,
          //   messageType: TOASTER_MESSAGE_TYPE.ERROR,
          // });
        }
        return throwError(() => error);
      })
    );
  }
}
