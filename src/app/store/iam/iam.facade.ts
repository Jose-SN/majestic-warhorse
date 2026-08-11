import { Injectable, inject } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable, firstValueFrom, mergeMap, of, take, throwError } from 'rxjs';
import { OrganizationListParams } from 'src/app/services/api-service/organization-api.service';
import { Organization, OrganizationCreatePayload } from 'src/app/models/organization.model';
import { UserOrganizationEntry } from 'src/app/models/organization-picker.model';
import { UserLogin, UserModel } from 'src/app/pages/login-page/model/user-model';
import { IPassWordUpdate } from 'src/app/pages/forgot-password/model';
import { IamOrganization, OrganizationSyncPayload } from 'src/app/core/auth/organization-oauth.service';
import { IamResponse, IamUser, UserSyncPayload } from 'src/app/core/auth/user-oauth.service';
import { IamApplicationActions, IamAuthActions, IamOrganizationActions } from './iam.actions';
import { selectAppId } from './iam.selectors';
import { IamApplication } from './iam.state';

@Injectable({ providedIn: 'root' })
export class IamFacade {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly appIdSignal = this.store.selectSignal(selectAppId);
  private loadApplicationPromise: Promise<string> | null = null;

  get appId(): string | null {
    return this.appIdSignal();
  }

  loadApplications(): Observable<IamApplication> {
    return this.run(
      IamApplicationActions.loadApplications(),
      IamApplicationActions.loadApplicationsSuccess.type,
      IamApplicationActions.loadApplicationsFailure.type,
      (action) => action['application'] as IamApplication
    );
  }

  ensureAppId(): Promise<string> {
    const existing = this.appId;
    if (existing) {
      return Promise.resolve(existing);
    }
    if (!this.loadApplicationPromise) {
      this.loadApplicationPromise = firstValueFrom(this.loadApplications())
        .then((application) => {
          if (!application?.id) {
            throw new Error('Application not loaded. Please refresh the page and try again.');
          }
          return application.id;
        })
        .finally(() => {
          this.loadApplicationPromise = null;
        });
    }
    return this.loadApplicationPromise;
  }

  loginUser(credentials: UserLogin): Observable<unknown> {
    return this.run(
      IamAuthActions.loginUser({ credentials }),
      IamAuthActions.loginUserSuccess.type,
      IamAuthActions.loginUserFailure.type,
      (action) => action['response']
    );
  }

  loginOrganization(credentials: { email: string; password: string }): Observable<unknown> {
    return this.run(
      IamOrganizationActions.loginOrganization({ credentials }),
      IamOrganizationActions.loginOrganizationSuccess.type,
      IamOrganizationActions.loginOrganizationFailure.type,
      (action) => action['response']
    );
  }

  loadUsers(): Promise<UserModel[]> {
    return firstValueFrom(
      this.run(
        IamAuthActions.loadUsers(),
        IamAuthActions.loadUsersSuccess.type,
        IamAuthActions.loadUsersFailure.type,
        (action) => (action['users'] as UserModel[]) || []
      )
    );
  }

  loadUsersByOrganization(organizationId: string): Promise<UserModel[]> {
    return firstValueFrom(
      this.run(
        IamAuthActions.loadUsersByOrganization({ organizationId }),
        IamAuthActions.loadUsersByOrganizationSuccess.type,
        IamAuthActions.loadUsersByOrganizationFailure.type,
        (action) => (action['users'] as UserModel[]) || []
      )
    );
  }

  resolveUsersForOrganization(organizationId: string, cached: UserModel[] = []): Promise<UserModel[]> {
    return firstValueFrom(
      this.run(
        IamAuthActions.resolveUsersForOrganization({ organizationId, cached }),
        IamAuthActions.resolveUsersForOrganizationSuccess.type,
        IamAuthActions.resolveUsersForOrganizationFailure.type,
        (action) => (action['users'] as UserModel[]) || []
      )
    );
  }

  loadUserById(userId: string): Promise<UserModel | null> {
    return firstValueFrom(
      this.run(
        IamAuthActions.loadUserById({ userId }),
        IamAuthActions.loadUserByIdSuccess.type,
        IamAuthActions.loadUserByIdFailure.type,
        (action) => (action['user'] as UserModel | null) ?? null
      )
    );
  }

  loadUserByEmail(email: string): Promise<IamUser | null> {
    return firstValueFrom(
      this.run(
        IamAuthActions.loadUserByEmail({ email }),
        IamAuthActions.loadUserByEmailSuccess.type,
        IamAuthActions.loadUserByEmailFailure.type,
        (action) => (action['user'] as IamUser | null) ?? null
      )
    );
  }

  saveUser(payload: Record<string, unknown>): Observable<unknown> {
    return this.run(
      IamAuthActions.saveUser({ payload }),
      IamAuthActions.saveUserSuccess.type,
      IamAuthActions.saveUserFailure.type,
      (action) => action['user']
    );
  }

  updateUser(payload: Record<string, unknown>): Observable<unknown> {
    return this.run(
      IamAuthActions.updateUser({ payload }),
      IamAuthActions.updateUserSuccess.type,
      IamAuthActions.updateUserFailure.type,
      (action) => action['user']
    );
  }

  deleteUser(payload: Record<string, unknown>): Observable<unknown> {
    return this.run(
      IamAuthActions.deleteUser({ payload }),
      IamAuthActions.deleteUserSuccess.type,
      IamAuthActions.deleteUserFailure.type,
      () => undefined
    );
  }

  updateUserPassword(payload: IPassWordUpdate): Observable<unknown> {
    return this.run(
      IamAuthActions.updateUserPassword({ payload }),
      IamAuthActions.updateUserPasswordSuccess.type,
      IamAuthActions.updateUserPasswordFailure.type,
      (action) => action['response']
    );
  }

  confirmUserPassword(payload: IPassWordUpdate): Observable<unknown> {
    return this.run(
      IamAuthActions.confirmUserPassword({ payload }),
      IamAuthActions.confirmUserPasswordSuccess.type,
      IamAuthActions.confirmUserPasswordFailure.type,
      (action) => action['response']
    );
  }

  syncUser(payload: UserSyncPayload): Promise<IamResponse<IamUser>> {
    return firstValueFrom(
      this.run(
        IamAuthActions.syncUser({ payload }),
        IamAuthActions.syncUserSuccess.type,
        IamAuthActions.syncUserFailure.type,
        (action) => action['response'] as IamResponse<IamUser>
      )
    );
  }

  loadOrganizations(): Observable<Organization[]> {
    return this.run(
      IamOrganizationActions.loadOrganizations(),
      IamOrganizationActions.loadOrganizationsSuccess.type,
      IamOrganizationActions.loadOrganizationsFailure.type,
      (action) => (action['organizations'] as Organization[]) || []
    );
  }

  saveOrganization(payload: OrganizationCreatePayload): Observable<unknown> {
    return this.run(
      IamOrganizationActions.saveOrganization({ payload }),
      IamOrganizationActions.saveOrganizationSuccess.type,
      IamOrganizationActions.saveOrganizationFailure.type,
      (action) => action['organization']
    );
  }

  updateOrganization(payload: Partial<Organization> & { id: string }): Observable<unknown> {
    return this.run(
      IamOrganizationActions.updateOrganization({ payload }),
      IamOrganizationActions.updateOrganizationSuccess.type,
      IamOrganizationActions.updateOrganizationFailure.type,
      (action) => action['organization']
    );
  }

  loadOrganizationsForUser(params: OrganizationListParams = {}): Observable<UserOrganizationEntry[]> {
    return this.run(
      IamOrganizationActions.loadOrganizationsForUser({ params }),
      IamOrganizationActions.loadOrganizationsForUserSuccess.type,
      IamOrganizationActions.loadOrganizationsForUserFailure.type,
      (action) => (action['organizations'] as UserOrganizationEntry[]) || []
    );
  }

  updateOrganizationPassword(payload: { email: string; password: string }): Observable<unknown> {
    return this.run(
      IamOrganizationActions.updateOrganizationPassword({ payload }),
      IamOrganizationActions.updateOrganizationPasswordSuccess.type,
      IamOrganizationActions.updateOrganizationPasswordFailure.type,
      (action) => action['response']
    );
  }

  confirmOrganizationPassword(payload: {
    email: string;
    otp: string;
    password: string;
  }): Observable<unknown> {
    return this.run(
      IamOrganizationActions.confirmOrganizationPassword({ payload }),
      IamOrganizationActions.confirmOrganizationPasswordSuccess.type,
      IamOrganizationActions.confirmOrganizationPasswordFailure.type,
      (action) => action['response']
    );
  }

  loadOrganizationByEmail(email: string): Promise<IamOrganization | null> {
    return firstValueFrom(
      this.run(
        IamOrganizationActions.loadOrganizationByEmail({ email }),
        IamOrganizationActions.loadOrganizationByEmailSuccess.type,
        IamOrganizationActions.loadOrganizationByEmailFailure.type,
        (action) => (action['organization'] as IamOrganization | null) ?? null
      )
    );
  }

  syncOrganization(payload: OrganizationSyncPayload): Promise<IamResponse<IamOrganization>> {
    return firstValueFrom(
      this.run(
        IamOrganizationActions.syncOrganization({ payload }),
        IamOrganizationActions.syncOrganizationSuccess.type,
        IamOrganizationActions.syncOrganizationFailure.type,
        (action) => action['response'] as IamResponse<IamOrganization>
      )
    );
  }

  private run<T>(
    request: Action,
    successType: string,
    failureType: string,
    project: (action: Record<string, unknown>) => T
  ): Observable<T> {
    const result$ = this.actions$.pipe(
      ofType(successType, failureType),
      take(1),
      mergeMap((action) => {
        if (action.type === failureType) {
          const message = (action as { error?: string }).error ?? 'Request failed';
          return throwError(() => ({
            message,
            errors: [{ msg: message }],
          }));
        }
        return of(project(action as unknown as Record<string, unknown>));
      })
    );
    this.store.dispatch(request);
    return result$;
  }
}
