import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

/** Keep in sync with the cleanup key in index.html */
const SW_CLEANUP_KEY = 'mw-sw-cleanup-v1';

/**
 * Safety net if index.html cleanup was skipped (e.g. old cached index).
 * Unregisters leftover Angular service workers and clears Cache Storage.
 */
async function clearLegacyServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (localStorage.getItem(SW_CLEANUP_KEY) === 'done') {
    return false;
  }

  let shouldReload = false;

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) {
      shouldReload = true;
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  }

  if ('caches' in window) {
    const cacheKeys = await caches.keys();
    if (cacheKeys.length > 0) {
      shouldReload = true;
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  }

  localStorage.setItem(SW_CLEANUP_KEY, 'done');
  return shouldReload;
}

async function bootstrap(): Promise<void> {
  if (environment.production) {
    enableProdMode();
  }

  try {
    const shouldReload = await clearLegacyServiceWorker();
    if (shouldReload) {
      window.location.reload();
      return;
    }
  } catch {
    localStorage.setItem(SW_CLEANUP_KEY, 'done');
  }

  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
}

bootstrap();
