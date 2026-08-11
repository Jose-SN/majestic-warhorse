import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, from, map, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApplicationApiService } from 'src/app/services/api-service/application-api.service';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { RegistrationApiService } from 'src/app/services/api-service/registration-api.service';
import { CommonApiService } from 'src/app/shared/api-service/common-api.service';
import { UserOAuthService } from 'src/app/core/auth/user-oauth.service';
import { OrganizationOAuthService } from 'src/app/core/auth/organization-oauth.service';
import { IRegistrationModel } from 'src/app/pages/registration-page/model/registration-model';
import { IamApplicationActions, IamAuthActions, IamOrganizationActions } from './iam.actions';
import { IamApplication } from './iam.state';
import { extractJwt, getErrorMessage, mapUserOrganizationEntries, unwrapList } from './iam.utils';

@Injectable()
export class IamEffects {
  private readonly actions$ = inject(Actions);
  private readonly applicationApi = inject(ApplicationApiService);
  private readonly authApi = inject(AuthService);
  private readonly organizationApi = inject(OrganizationApiService);
  private readonly registrationApi = inject(RegistrationApiService);
  private readonly commonApi = inject(CommonApiService);
  private readonly userOAuth = inject(UserOAuthService);
  private readonly organizationOAuth = inject(OrganizationOAuthService);

  persistApplication$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(IamApplicationActions.loadApplicationsSuccess),
        tap(({ application }) => {
          sessionStorage.setItem('application', JSON.stringify(application));
          sessionStorage.setItem('app_id', application.id);
          if (application.client_id) {
            sessionStorage.setItem('client_id', String(application.client_id));
          }
        })
      ),
    { dispatch: false }
  );

  loadApplications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamApplicationActions.loadApplications),
      exhaustMap(() =>
        this.applicationApi.getApplications().pipe(
          map((response) => {
            const apps = unwrapList<IamApplication>(response);
            const application =
              apps.find((entry) => entry.client_id === environment.client_id) ?? apps[0] ?? null;
            if (!application?.id) {
              return IamApplicationActions.loadApplicationsFailure({
                error: 'Application not loaded. Please refresh the page and try again.',
              });
            }
            return IamApplicationActions.loadApplicationsSuccess({ application });
          }),
          catchError((error) =>
            of(IamApplicationActions.loadApplicationsFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  loginUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.loginUser),
      exhaustMap(({ credentials }) =>
        this.authApi.loginUser(credentials).pipe(
          map((response) =>
            IamAuthActions.loginUserSuccess({
              response,
              token: extractJwt(response),
            })
          ),
          catchError((error) =>
            of(IamAuthActions.loginUserFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  loginOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamOrganizationActions.loginOrganization),
      exhaustMap(({ credentials }) =>
        this.organizationApi.login(credentials).pipe(
          map((response) =>
            IamOrganizationActions.loginOrganizationSuccess({
              response,
              token: extractJwt(response),
            })
          ),
          catchError((error) =>
            of(IamOrganizationActions.loginOrganizationFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.loadUsers),
      switchMap(() =>
        from(this.authApi.getAllUsers()).pipe(
          map((users) => IamAuthActions.loadUsersSuccess({ users: users || [] })),
          catchError((error) =>
            of(IamAuthActions.loadUsersFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  loadUsersByOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.loadUsersByOrganization),
      switchMap(({ organizationId }) =>
        from(this.authApi.getUsersByOrganization(organizationId)).pipe(
          map((users) => IamAuthActions.loadUsersByOrganizationSuccess({ users: users || [] })),
          catchError((error) =>
            of(IamAuthActions.loadUsersByOrganizationFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  resolveUsersForOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.resolveUsersForOrganization),
      switchMap(({ organizationId, cached }) =>
        from(this.authApi.resolveUsersForOrganization(organizationId, cached)).pipe(
          map((users) => IamAuthActions.resolveUsersForOrganizationSuccess({ users: users || [] })),
          catchError((error) =>
            of(IamAuthActions.resolveUsersForOrganizationFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  loadUserById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.loadUserById),
      switchMap(({ userId }) =>
        from(this.authApi.getUserById(userId)).pipe(
          map((user) => IamAuthActions.loadUserByIdSuccess({ user })),
          catchError((error) =>
            of(IamAuthActions.loadUserByIdFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  loadUserByEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.loadUserByEmail),
      switchMap(({ email }) =>
        from(this.userOAuth.getUserByEmail(email)).pipe(
          map((user) => IamAuthActions.loadUserByEmailSuccess({ user })),
          catchError((error) =>
            of(IamAuthActions.loadUserByEmailFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  saveUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.saveUser),
      exhaustMap(({ payload }) =>
        this.registrationApi.saveUserInfo(payload as unknown as IRegistrationModel).pipe(
          map((user) => IamAuthActions.saveUserSuccess({ user })),
          catchError((error) =>
            of(IamAuthActions.saveUserFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.updateUser),
      exhaustMap(({ payload }) =>
        this.authApi.updateUserInfo(payload).pipe(
          map((user) => IamAuthActions.updateUserSuccess({ user })),
          catchError((error) =>
            of(IamAuthActions.updateUserFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.deleteUser),
      exhaustMap(({ payload }) =>
        this.commonApi.deleteUser(payload).pipe(
          map(() => IamAuthActions.deleteUserSuccess()),
          catchError((error) =>
            of(IamAuthActions.deleteUserFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  updateUserPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.updateUserPassword),
      exhaustMap(({ payload }) =>
        this.authApi.updatePassword(payload).pipe(
          map((response) => IamAuthActions.updateUserPasswordSuccess({ response })),
          catchError((error) =>
            of(IamAuthActions.updateUserPasswordFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  confirmUserPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.confirmUserPassword),
      exhaustMap(({ payload }) =>
        this.authApi.validateOtp(payload).pipe(
          map((response) => IamAuthActions.confirmUserPasswordSuccess({ response })),
          catchError((error) =>
            of(IamAuthActions.confirmUserPasswordFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  syncUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamAuthActions.syncUser),
      exhaustMap(({ payload }) =>
        from(this.userOAuth.syncUser(payload)).pipe(
          map((response) => IamAuthActions.syncUserSuccess({ response })),
          catchError((error) => of(IamAuthActions.syncUserFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  loadOrganizations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamOrganizationActions.loadOrganizations),
      switchMap(() =>
        this.organizationApi.getOrganizations().pipe(
          map((response) =>
            IamOrganizationActions.loadOrganizationsSuccess({
              organizations: unwrapList(response),
            })
          ),
          catchError((error) =>
            of(IamOrganizationActions.loadOrganizationsFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  saveOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamOrganizationActions.saveOrganization),
      exhaustMap(({ payload }) =>
        this.organizationApi.saveOrganization(payload).pipe(
          map((organization) => IamOrganizationActions.saveOrganizationSuccess({ organization })),
          catchError((error) =>
            of(IamOrganizationActions.saveOrganizationFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  updateOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamOrganizationActions.updateOrganization),
      exhaustMap(({ payload }) =>
        this.organizationApi.update(payload).pipe(
          map((organization) => IamOrganizationActions.updateOrganizationSuccess({ organization })),
          catchError((error) =>
            of(IamOrganizationActions.updateOrganizationFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );

  loadOrganizationsForUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamOrganizationActions.loadOrganizationsForUser),
      switchMap(({ params }) =>
        this.organizationApi.listOrganizationsForUser(params).pipe(
          map((response) =>
            IamOrganizationActions.loadOrganizationsForUserSuccess({
              organizations: mapUserOrganizationEntries(response),
            })
          ),
          catchError((error) =>
            of(
              IamOrganizationActions.loadOrganizationsForUserFailure({
                error: getErrorMessage(error),
              })
            )
          )
        )
      )
    )
  );

  updateOrganizationPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamOrganizationActions.updateOrganizationPassword),
      exhaustMap(({ payload }) =>
        this.organizationApi.updatePassword(payload).pipe(
          map((response) => IamOrganizationActions.updateOrganizationPasswordSuccess({ response })),
          catchError((error) =>
            of(
              IamOrganizationActions.updateOrganizationPasswordFailure({
                error: getErrorMessage(error),
              })
            )
          )
        )
      )
    )
  );

  confirmOrganizationPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamOrganizationActions.confirmOrganizationPassword),
      exhaustMap(({ payload }) =>
        this.organizationApi.validateOtp(payload).pipe(
          map((response) => IamOrganizationActions.confirmOrganizationPasswordSuccess({ response })),
          catchError((error) =>
            of(
              IamOrganizationActions.confirmOrganizationPasswordFailure({
                error: getErrorMessage(error),
              })
            )
          )
        )
      )
    )
  );

  loadOrganizationByEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamOrganizationActions.loadOrganizationByEmail),
      switchMap(({ email }) =>
        from(this.organizationOAuth.getOrganizationByEmail(email)).pipe(
          map((organization) =>
            IamOrganizationActions.loadOrganizationByEmailSuccess({ organization })
          ),
          catchError((error) =>
            of(
              IamOrganizationActions.loadOrganizationByEmailFailure({
                error: getErrorMessage(error),
              })
            )
          )
        )
      )
    )
  );

  syncOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IamOrganizationActions.syncOrganization),
      exhaustMap(({ payload }) =>
        from(this.organizationOAuth.syncOrganization(payload)).pipe(
          map((response) => IamOrganizationActions.syncOrganizationSuccess({ response })),
          catchError((error) =>
            of(IamOrganizationActions.syncOrganizationFailure({ error: getErrorMessage(error) }))
          )
        )
      )
    )
  );
}
