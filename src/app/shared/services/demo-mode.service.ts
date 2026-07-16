import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const DEMO_MODE_STORAGE_KEY = 'majestic_demo_mode';
const DEMO_TRANSITION_MS = 700;

@Injectable({
  providedIn: 'root',
})
export class DemoModeService {
  private readonly demoModeSubject = new BehaviorSubject<boolean>(this.readStoredValue());
  private readonly demoLoadingSubject = new BehaviorSubject<boolean>(false);

  readonly demoMode$ = this.demoModeSubject.asObservable();
  readonly demoLoading$ = this.demoLoadingSubject.asObservable();

  get isDemoMode(): boolean {
    return this.demoModeSubject.value;
  }

  get isDemoLoading(): boolean {
    return this.demoLoadingSubject.value;
  }

  toggleDemoMode(): void {
    this.setDemoMode(!this.isDemoMode, { animate: true });
  }

  setDemoMode(enabled: boolean, options: { animate?: boolean } = {}): void {
    if (options.animate) {
      void this.transitionDemoMode(enabled);
      return;
    }

    sessionStorage.setItem(DEMO_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
    this.demoModeSubject.next(enabled);
  }

  private async transitionDemoMode(enabled: boolean): Promise<void> {
    if (this.isDemoMode === enabled || this.isDemoLoading) {
      return;
    }

    this.demoLoadingSubject.next(true);

    await this.delay(DEMO_TRANSITION_MS);

    sessionStorage.setItem(DEMO_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
    this.demoModeSubject.next(enabled);
    this.demoLoadingSubject.next(false);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private readStoredValue(): boolean {
    return sessionStorage.getItem(DEMO_MODE_STORAGE_KEY) === 'true';
  }
}
