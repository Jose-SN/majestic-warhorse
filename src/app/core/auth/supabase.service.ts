import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly _client: SupabaseClient;

  constructor() {
    this._client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: localStorage,
      },
    });
  }

  get client(): SupabaseClient {
    return this._client;
  }
}
