import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService {
  private _apiUrl: string = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

}
