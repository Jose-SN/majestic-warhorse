import {
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  Injectable,
} from '@angular/core';
import { IConfirmationPopupConfig } from './confirmation-popup.model';
import { ConfirmationPopupComponent } from './confirmation-popup.component';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationPopupService {
  private componentRef: ReturnType<typeof createComponent> | null = null;
  private resolveAlert: (() => void) | null = null;
  private resolveConfirm: ((value: boolean) => void) | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  /** Show an alert popup (single OK button). Returns Promise that resolves when user clicks OK. */
  showAlert(message: string, title: string = 'Notice'): Promise<void> {
    return new Promise((resolve) => {
      this.resolveAlert = resolve;
      this.show({
        title,
        message,
        type: 'alert',
        confirmText: 'OK',
      });
    });
  }

  /** Show a confirmation popup (Confirm/Cancel buttons). Returns Promise<boolean> - true if confirmed, false if cancelled. */
  showConfirm(
    message: string,
    title: string = 'Confirm',
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolveConfirm = resolve;
      this.show({
        title,
        message,
        type: 'confirm',
        confirmText,
        cancelText,
      });
    });
  }

  private show(config: IConfirmationPopupConfig): void {
    this.destroy();

    const componentRef = createComponent(ConfirmationPopupComponent, {
      environmentInjector: this.injector,
    });

    componentRef.instance.config = config;
    componentRef.instance.result.subscribe((confirmed: boolean) => {
      this.onResult(confirmed);
    });

    document.body.appendChild(componentRef.location.nativeElement);
    this.appRef.attachView(componentRef.hostView);
    this.componentRef = componentRef;
  }

  /** Called by the popup component when user clicks a button. */
  onResult(confirmed: boolean): void {
    this.destroy();
    if (this.resolveAlert) {
      this.resolveAlert();
      this.resolveAlert = null;
    }
    if (this.resolveConfirm !== null) {
      this.resolveConfirm(confirmed);
      this.resolveConfirm = null;
    }
  }

  private destroy(): void {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }
}
