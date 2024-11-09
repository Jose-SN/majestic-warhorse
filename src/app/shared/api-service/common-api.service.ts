import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from '../services/common.service';
import { catchError, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonApiService {
  private _apiUrl: string = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}
  uploadImage(selectedFile: FormData) {
    return this.http
      .post<{ [key: string]: string }>(`${this._apiUrl}file/upload`, selectedFile)
      .pipe(catchError(this.commonService.handleError));
  }
}
