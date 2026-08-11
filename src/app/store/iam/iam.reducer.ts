import { createReducer, on } from '@ngrx/store';
import { IamApplicationActions, IamAuthActions, IamOrganizationActions } from './iam.actions';
import { initialIamState } from './iam.state';

export const iamReducer = createReducer(
  initialIamState,

  on(IamApplicationActions.loadApplications, (state) => ({
    ...state,
    loadingApplication: true,
    error: null,
  })),
  on(IamApplicationActions.loadApplicationsSuccess, (state, { application }) => ({
    ...state,
    application,
    appId: application.id,
    clientId: application.client_id ?? null,
    loadingApplication: false,
    error: null,
  })),
  on(IamApplicationActions.loadApplicationsFailure, (state, { error }) => ({
    ...state,
    loadingApplication: false,
    error,
  })),

  on(IamAuthActions.loginUser, IamOrganizationActions.loginOrganization, (state) => ({
    ...state,
    loadingLogin: true,
    error: null,
  })),
  on(IamAuthActions.loginUserSuccess, IamOrganizationActions.loginOrganizationSuccess, (state, { token }) => ({
    ...state,
    token,
    loadingLogin: false,
    error: null,
  })),
  on(IamAuthActions.loginUserFailure, IamOrganizationActions.loginOrganizationFailure, (state, { error }) => ({
    ...state,
    loadingLogin: false,
    error,
  })),

  on(
    IamAuthActions.loadUsers,
    IamAuthActions.loadUsersByOrganization,
    IamAuthActions.resolveUsersForOrganization,
    (state) => ({
      ...state,
      loadingUsers: true,
      error: null,
    })
  ),
  on(
    IamAuthActions.loadUsersSuccess,
    IamAuthActions.loadUsersByOrganizationSuccess,
    IamAuthActions.resolveUsersForOrganizationSuccess,
    (state, { users }) => ({
      ...state,
      users,
      loadingUsers: false,
      error: null,
    })
  ),
  on(
    IamAuthActions.loadUsersFailure,
    IamAuthActions.loadUsersByOrganizationFailure,
    IamAuthActions.resolveUsersForOrganizationFailure,
    (state, { error }) => ({
      ...state,
      loadingUsers: false,
      error,
    })
  ),

  on(IamAuthActions.loadUserById, IamAuthActions.loadUserByEmail, (state) => ({
    ...state,
    loadingUsers: true,
    error: null,
  })),
  on(IamAuthActions.loadUserByIdSuccess, (state, { user }) => ({
    ...state,
    selectedUser: user,
    loadingUsers: false,
    error: null,
  })),
  on(IamAuthActions.loadUserByEmailSuccess, (state, { user }) => ({
    ...state,
    selectedUser: user,
    loadingUsers: false,
    error: null,
  })),
  on(IamAuthActions.loadUserByIdFailure, IamAuthActions.loadUserByEmailFailure, (state, { error }) => ({
    ...state,
    loadingUsers: false,
    error,
  })),

  on(IamAuthActions.saveUser, (state) => ({
    ...state,
    savingUser: true,
    error: null,
  })),
  on(IamAuthActions.saveUserSuccess, (state) => ({
    ...state,
    savingUser: false,
    error: null,
  })),
  on(IamAuthActions.saveUserFailure, (state, { error }) => ({
    ...state,
    savingUser: false,
    error,
  })),

  on(IamAuthActions.updateUser, (state) => ({
    ...state,
    updatingUser: true,
    error: null,
  })),
  on(IamAuthActions.updateUserSuccess, (state) => ({
    ...state,
    updatingUser: false,
    error: null,
  })),
  on(IamAuthActions.updateUserFailure, (state, { error }) => ({
    ...state,
    updatingUser: false,
    error,
  })),

  on(IamAuthActions.deleteUser, (state) => ({
    ...state,
    deletingUser: true,
    error: null,
  })),
  on(IamAuthActions.deleteUserSuccess, (state) => ({
    ...state,
    deletingUser: false,
    error: null,
  })),
  on(IamAuthActions.deleteUserFailure, (state, { error }) => ({
    ...state,
    deletingUser: false,
    error,
  })),

  on(IamAuthActions.updateUserPassword, IamOrganizationActions.updateOrganizationPassword, (state) => ({
    ...state,
    updatingPassword: true,
    error: null,
  })),
  on(
    IamAuthActions.updateUserPasswordSuccess,
    IamOrganizationActions.updateOrganizationPasswordSuccess,
    (state) => ({
      ...state,
      updatingPassword: false,
      error: null,
    })
  ),
  on(
    IamAuthActions.updateUserPasswordFailure,
    IamOrganizationActions.updateOrganizationPasswordFailure,
    (state, { error }) => ({
      ...state,
      updatingPassword: false,
      error,
    })
  ),

  on(IamAuthActions.confirmUserPassword, IamOrganizationActions.confirmOrganizationPassword, (state) => ({
    ...state,
    confirmingPassword: true,
    error: null,
  })),
  on(
    IamAuthActions.confirmUserPasswordSuccess,
    IamOrganizationActions.confirmOrganizationPasswordSuccess,
    (state) => ({
      ...state,
      confirmingPassword: false,
      error: null,
    })
  ),
  on(
    IamAuthActions.confirmUserPasswordFailure,
    IamOrganizationActions.confirmOrganizationPasswordFailure,
    (state, { error }) => ({
      ...state,
      confirmingPassword: false,
      error,
    })
  ),

  on(IamAuthActions.syncUser, IamOrganizationActions.syncOrganization, (state) => ({
    ...state,
    syncing: true,
    error: null,
  })),
  on(IamAuthActions.syncUserSuccess, IamOrganizationActions.syncOrganizationSuccess, (state) => ({
    ...state,
    syncing: false,
    error: null,
  })),
  on(IamAuthActions.syncUserFailure, IamOrganizationActions.syncOrganizationFailure, (state, { error }) => ({
    ...state,
    syncing: false,
    error,
  })),

  on(IamOrganizationActions.loadOrganizations, (state) => ({
    ...state,
    loadingOrganizations: true,
    error: null,
  })),
  on(IamOrganizationActions.loadOrganizationsSuccess, (state, { organizations }) => ({
    ...state,
    organizations,
    loadingOrganizations: false,
    error: null,
  })),
  on(IamOrganizationActions.loadOrganizationsFailure, (state, { error }) => ({
    ...state,
    loadingOrganizations: false,
    error,
  })),

  on(IamOrganizationActions.saveOrganization, (state) => ({
    ...state,
    savingOrganization: true,
    error: null,
  })),
  on(IamOrganizationActions.saveOrganizationSuccess, (state) => ({
    ...state,
    savingOrganization: false,
    error: null,
  })),
  on(IamOrganizationActions.saveOrganizationFailure, (state, { error }) => ({
    ...state,
    savingOrganization: false,
    error,
  })),

  on(IamOrganizationActions.updateOrganization, (state) => ({
    ...state,
    updatingOrganization: true,
    error: null,
  })),
  on(IamOrganizationActions.updateOrganizationSuccess, (state) => ({
    ...state,
    updatingOrganization: false,
    error: null,
  })),
  on(IamOrganizationActions.updateOrganizationFailure, (state, { error }) => ({
    ...state,
    updatingOrganization: false,
    error,
  })),

  on(IamOrganizationActions.loadOrganizationsForUser, (state) => ({
    ...state,
    loadingUserOrganizations: true,
    error: null,
  })),
  on(IamOrganizationActions.loadOrganizationsForUserSuccess, (state, { organizations }) => ({
    ...state,
    userOrganizations: organizations,
    loadingUserOrganizations: false,
    error: null,
  })),
  on(IamOrganizationActions.loadOrganizationsForUserFailure, (state, { error }) => ({
    ...state,
    loadingUserOrganizations: false,
    error,
  })),

  on(IamOrganizationActions.loadOrganizationByEmail, (state) => ({
    ...state,
    loadingOrganizations: true,
    error: null,
  })),
  on(IamOrganizationActions.loadOrganizationByEmailSuccess, (state, { organization }) => ({
    ...state,
    selectedOrganization: organization,
    loadingOrganizations: false,
    error: null,
  })),
  on(IamOrganizationActions.loadOrganizationByEmailFailure, (state, { error }) => ({
    ...state,
    loadingOrganizations: false,
    error,
  }))
);
