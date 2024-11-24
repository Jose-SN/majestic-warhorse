import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FileDownloadApiService {
  private _apiUrl: string = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}
  getBlobFile(blobPayload: { [key: string]: string }) {
    return this.http
      .post<any>(`${this._apiUrl}file/get-blob`, blobPayload, {
        observe: 'response',
        responseType: 'blob',
      } as any)
      .pipe(catchError(this.commonService.handleError));
  }
}
