import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

export interface IOrganization {
  id: string;
  name?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationApiService {
  private _apiUrl: string = environment.iamApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  getOrganizations() {
    return this.http
      .get<{ data: IOrganization[] } | IOrganization[]>(`${this._apiUrl}organization/get`)
      .pipe(catchError(this.commonService.handleError));
  }
}
