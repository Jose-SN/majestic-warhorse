import { iamReducer } from './iam.reducer';
import { IamAuthActions } from './iam.actions';
import { initialIamState } from './iam.state';

describe('iamReducer', () => {
  it('stores users on load success', () => {
    const users = [{ id: 'u1', first_name: 'Ada' }];
    const state = iamReducer(initialIamState, IamAuthActions.loadUsersSuccess({ users }));
    expect(state.users).toEqual(users);
    expect(state.loadingUsers).toBeFalse();
    expect(state.error).toBeNull();
  });

  it('stores error on load failure without mutating users', () => {
    const hydrated = iamReducer(
      initialIamState,
      IamAuthActions.loadUsersSuccess({ users: [{ id: 'u1' }] })
    );
    const state = iamReducer(hydrated, IamAuthActions.loadUsersFailure({ error: 'boom' }));
    expect(state.users.length).toBe(1);
    expect(state.loadingUsers).toBeFalse();
    expect(state.error).toBe('boom');
  });
});
