import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { iamReducer } from './iam/iam.reducer';
import { IamState } from './iam/iam.state';

/**
 * Root store. Do not persist this store to localStorage/sessionStorage.
 */
export interface AppState {
  iam: IamState;
}

export const reducers: ActionReducerMap<AppState> = {
  iam: iamReducer,
};

export const metaReducers: MetaReducer<AppState>[] = [];
