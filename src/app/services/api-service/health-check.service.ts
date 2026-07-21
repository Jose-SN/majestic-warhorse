import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

export type ServiceHealthStatus = 'unknown' | 'checking' | 'up' | 'down';

export interface ServiceHealthItem {
  key: 'iam' | 'majestic';
  label: string;
  status: ServiceHealthStatus;
  url: string;
  message?: string;
  checkedAt?: Date;
}

export interface ServicesHealthState {
  checking: boolean;
  iam: ServiceHealthItem;
  majestic: ServiceHealthItem;
  allHealthy: boolean;
  hasOutage: boolean;
}

/** Header used by SpinnerInterceptor to skip the global spinner. */
export const SKIP_SPINNER_HEADER = 'X-Skip-Spinner';

@Injectable({
  providedIn: 'root',
})
export class HealthCheckService {
  private readonly pingTimeoutMs = 8000;
  private readonly skipSpinnerHeaders = new HttpHeaders().set(SKIP_SPINNER_HEADER, '1');

  private readonly stateSubject = new BehaviorSubject<ServicesHealthState>(this.buildInitialState());
  readonly state$: Observable<ServicesHealthState> = this.stateSubject.asObservable();

  private notifiedOutage = false;
  private initialCheckStarted = false;
  private inFlight: Promise<ServicesHealthState> | null = null;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  get snapshot(): ServicesHealthState {
    return this.stateSubject.value;
  }

  /**
   * App-load health check — runs at most once per session.
   * Use `checkAll({ force: true })` only for an explicit Retry.
   */
  checkOnAppLoad(options: { notify?: boolean } = { notify: true }): Observable<ServicesHealthState> {
    if (this.initialCheckStarted) {
      return this.state$;
    }
    this.initialCheckStarted = true;
    return this.checkAll({ notify: options.notify !== false, force: false });
  }

  /**
   * Run health checks for IAM (`iamApi`) and Majestic Warhorse (`majesticWarhorseApi`).
   * Without `force`, skips if an initial check already ran or one is in flight.
   */
  checkAll(
    options: { notify?: boolean; force?: boolean } = { notify: true, force: false }
  ): Observable<ServicesHealthState> {
    if (!options.force && this.initialCheckStarted && !this.inFlight) {
      return new Observable<ServicesHealthState>((subscriber) => {
        subscriber.next(this.stateSubject.value);
        subscriber.complete();
      });
    }

    if (this.inFlight && !options.force) {
      return new Observable<ServicesHealthState>((subscriber) => {
        void this.inFlight!.then((state) => {
          subscriber.next(state);
          subscriber.complete();
        }).catch((error) => subscriber.error(error));
      });
    }

    this.initialCheckStarted = true;

    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      checking: true,
      iam: { ...current.iam, status: 'checking', message: undefined },
      majestic: { ...current.majestic, status: 'checking', message: undefined },
      allHealthy: false,
      hasOutage: false,
    });

    this.inFlight = this.runChecks(options.notify !== false).finally(() => {
      this.inFlight = null;
    });

    return new Observable<ServicesHealthState>((subscriber) => {
      void this.inFlight!.then((state) => {
        subscriber.next(state);
        subscriber.complete();
      }).catch((error) => subscriber.error(error));
    });
  }

  dismissBanner(): void {
    const current = this.stateSubject.value;
    if (!current.hasOutage) return;
    this.stateSubject.next({ ...current, hasOutage: false });
  }

  private async runChecks(notify: boolean): Promise<ServicesHealthState> {
    const iamBase = this.normalizeBase(environment.iamApi);
    const majesticBase = this.normalizeBase(environment.majesticWarhorseApi);

    const [iam, majestic] = await Promise.all([
      this.checkService('iam', 'IAM service', iamBase, [
        `${iamBase}/health`,
        `${iamBase}/application/get`,
      ]),
      this.checkService('majestic', 'Majestic Warhorse API', majesticBase, [
        `${majesticBase}/health`,
        majesticBase,
      ]),
    ]);

    const next: ServicesHealthState = {
      checking: false,
      iam,
      majestic,
      allHealthy: iam.status === 'up' && majestic.status === 'up',
      hasOutage: iam.status === 'down' || majestic.status === 'down',
    };
    this.stateSubject.next(next);

    if (notify && next.hasOutage) {
      this.notifyOutage(next);
    } else if (next.allHealthy) {
      this.notifiedOutage = false;
    }

    return next;
  }

  private async checkService(
    key: 'iam' | 'majestic',
    label: string,
    base: string,
    urls: string[]
  ): Promise<ServiceHealthItem> {
    for (const url of urls) {
      if (!url) continue;
      const reachable = await this.ping(url);
      if (reachable) {
        return this.upItem(key, label, base);
      }
    }
    return this.downItem(
      key,
      label,
      base,
      `${label} is unavailable. Please try again later.`
    );
  }

  /**
   * True when the host returns any HTTP status (incl. 4xx/5xx).
   * False on timeout, network failure, or CORS status 0.
   */
  private async ping(url: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http
          .get(url, {
            observe: 'response',
            responseType: 'text',
            headers: this.skipSpinnerHeaders,
          })
          .pipe(timeout(this.pingTimeoutMs))
      );
      return true;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'TimeoutError') {
        return false;
      }
      const httpErr = err as HttpErrorResponse;
      if (httpErr?.status && httpErr.status > 0) {
        return true;
      }
      return false;
    }
  }

  private notifyOutage(state: ServicesHealthState): void {
    if (this.notifiedOutage) return;
    this.notifiedOutage = true;

    const downLabels = [state.iam, state.majestic]
      .filter((s) => s.status === 'down')
      .map((s) => s.label);

    this.commonService.openToaster({
      message:
        downLabels.length === 2
          ? 'IAM and Majestic Warhorse services are unavailable right now.'
          : `${downLabels[0]} is unavailable right now.`,
      messageType: TOASTER_MESSAGE_TYPE.ERROR,
    });
  }

  private upItem(key: 'iam' | 'majestic', label: string, url: string): ServiceHealthItem {
    return { key, label, status: 'up', url, checkedAt: new Date() };
  }

  private downItem(
    key: 'iam' | 'majestic',
    label: string,
    url: string,
    message: string
  ): ServiceHealthItem {
    return { key, label, status: 'down', url, message, checkedAt: new Date() };
  }

  private normalizeBase(url: string): string {
    return (url || '').replace(/\/+$/, '');
  }

  private buildInitialState(): ServicesHealthState {
    const iamBase = this.normalizeBase(environment.iamApi);
    const majesticBase = this.normalizeBase(environment.majesticWarhorseApi);
    return {
      checking: false,
      iam: { key: 'iam', label: 'IAM service', status: 'unknown', url: iamBase },
      majestic: {
        key: 'majestic',
        label: 'Majestic Warhorse API',
        status: 'unknown',
        url: majesticBase,
      },
      allHealthy: false,
      hasOutage: false,
    };
  }
}
