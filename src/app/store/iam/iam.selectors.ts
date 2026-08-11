import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IAM_FEATURE_KEY, IamState } from './iam.state';

export const selectIamState = createFeatureSelector<IamState>(IAM_FEATURE_KEY);

export const selectIamApplication = createSelector(selectIamState, (state) => state.application);
export const selectAppId = createSelector(selectIamState, (state) => state.appId);
export const selectClientId = createSelector(selectIamState, (state) => state.clientId);
export const selectIamUsers = createSelector(selectIamState, (state) => state.users);
export const selectSelectedIamUser = createSelector(selectIamState, (state) => state.selectedUser);
export const selectIamOrganizations = createSelector(selectIamState, (state) => state.organizations);
export const selectUserOrganizations = createSelector(
  selectIamState,
  (state) => state.userOrganizations
);
export const selectSelectedIamOrganization = createSelector(
  selectIamState,
  (state) => state.selectedOrganization
);
export const selectIamToken = createSelector(selectIamState, (state) => state.token);
export const selectIamError = createSelector(selectIamState, (state) => state.error);
export const selectLoadingApplication = createSelector(
  selectIamState,
  (state) => state.loadingApplication
);
export const selectLoadingUsers = createSelector(selectIamState, (state) => state.loadingUsers);
export const selectLoadingOrganizations = createSelector(
  selectIamState,
  (state) => state.loadingOrganizations
);
