import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class SpinnerInterceptor implements HttpInterceptor {
  constructor(
    private spinner: NgxSpinnerService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const pagesToExclude: string[] = ['/auth/callback'];
    if (pagesToExclude.includes(this.router.url)) {
      return next.handle(req);
    }

    this.spinner.show();
    return next.handle(req).pipe(finalize(() => this.spinner.hide()));
  }
}
