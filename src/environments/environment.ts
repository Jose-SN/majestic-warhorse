// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  appVersion: '1.0.0',
  client_id: 'majestic_warhorse',
  apiUrl: 'https://rehobothlondonapi.netlify.app/.netlify/functions/api/',
  iamApi: 'http://localhost:5000/api/',
  majesticWarhorseApi: 'http://localhost:3000/'// 'https://majesticapi.rehoboth.london/',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
