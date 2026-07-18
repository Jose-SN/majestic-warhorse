import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

export interface SendGmailPayload {
  to: string;
  subject: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class MailApiService {
  private readonly apiUrl = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  sendGmail(payload: SendGmailPayload): Observable<unknown> {
    return this.http
      .post(`${this.apiUrl}mail/send-gmail`, payload)
      .pipe(catchError(this.commonService.handleError));
  }
}
