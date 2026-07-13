// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  appVersion: '1.0.0',
  client_id: 'majestic-warhorse',
  // iamApi: 'https://iamapi.thechurchmanager.com/api/',//'http://localhost:5000/api/',
  iamApi: 'http://localhost:5000/auth/api/',
  // majesticWarhorseApi: 'https://majesticapi.thechurchmanager.com/'//'http://localhost:3000/'// 'https://majesticapi.rehoboth.london/',
  majesticWarhorseApi: 'http://localhost:8081/',// 'https://majesticapi.rehoboth.london/',
  supabaseUrl: 'https://umskkgoddrmdqvvaiezu.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtc2trZ29kZHJtZHF2dmFpZXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjg0NDMsImV4cCI6MjA5NTY0NDQ0M30.LlpGAktLK6nS7xjIWFNSMnuMq3VK6Qc2B2y8xwh9nVI',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
