import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

export interface Favorite {
  id?: string;
  userId: string;
  courseId: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesApiService {
  private _apiUrl: string = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  /** Get all favorites for the current user */
  getFavorites(userId: string) {
    return this.http
      .get<any>(`${this._apiUrl}favorites/get?userId=${userId}`)
      .pipe(catchError(this.commonService.handleError));
  }

  /** Add a course to favorites */
  addFavorite(userId: string, courseId: string) {
    const params = new URLSearchParams({ user_id: userId, courseId });
    return this.http
      .post<any>(`${this._apiUrl}favorites/save?${params}`, { userId, courseId })
      .pipe(catchError(this.commonService.handleError));
  }

  /** Remove a course from favorites */
  removeFavorite(favoriteId: string) {
    return this.http
      .delete<any>(`${this._apiUrl}favorites/delete/${favoriteId}`)
      .pipe(catchError(this.commonService.handleError));
  }

  /** Remove by user and course (alternative delete) */
  removeFavoriteByCourse(userId: string, courseId: string) {
    return this.http
      .delete<any>(`${this._apiUrl}favorites/delete?userId=${userId}&courseId=${courseId}`)
      .pipe(catchError(this.commonService.handleError));
  }

  /** Check if a course is favorited */
  isFavorited(userId: string, courseId: string) {
    return this.http
      .get<{ favorited: boolean; favoriteId?: string }>(
        `${this._apiUrl}favorites/check?userId=${userId}&courseId=${courseId}`
      )
      .pipe(catchError(this.commonService.handleError));
  }
}
