import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { CourseApiResponse, PaginatedResponse, RosterRow } from 'src/app/models/roster.model';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

export interface StudentSavePayload {
  organization_id: string;
  user_id?: string;
  status?: string;
  first_name?: string;
  last_name?: string;
  contact?: { email?: string; phone?: string };
}

export interface StudentListParams {
  organization_id?: string;
  user_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class StudentsApiService {
  private readonly _apiUrl = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  getStudents(params: StudentListParams = {}): Observable<PaginatedResponse<RosterRow>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http
      .get<PaginatedResponse<RosterRow>>(`${this._apiUrl}students/get`, { params: httpParams })
      .pipe(catchError(this.commonService.handleError));
  }

  saveStudent(payload: StudentSavePayload): Observable<CourseApiResponse<RosterRow>> {
    return this.http
      .post<CourseApiResponse<RosterRow>>(`${this._apiUrl}students/save`, payload)
      .pipe(catchError(this.commonService.handleError));
  }

  approveStudent(rosterRowId: string, status = 'approved'): Observable<CourseApiResponse<RosterRow>> {
    return this.http
      .put<CourseApiResponse<RosterRow>>(`${this._apiUrl}students/approve/${rosterRowId}`, { status })
      .pipe(catchError(this.commonService.handleError));
  }

  approveStudentsBulk(ids: string[], status = 'approved'): Observable<CourseApiResponse<unknown>> {
    return this.http
      .put<CourseApiResponse<unknown>>(`${this._apiUrl}students/approve`, { ids, status })
      .pipe(catchError(this.commonService.handleError));
  }

  listStudents(params: StudentListParams = {}): Observable<RosterRow[]> {
    return this.getStudents(params).pipe(
      map((res) => {
        const data = res?.data ?? (res as unknown as RosterRow[]);
        return Array.isArray(data) ? data : [];
      })
    );
  }
}
