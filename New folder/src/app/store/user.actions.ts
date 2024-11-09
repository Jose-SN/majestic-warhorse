import { createAction, props } from '@ngrx/store';

export const getUser = createAction('GET [User]', props<{ data: any }>());
