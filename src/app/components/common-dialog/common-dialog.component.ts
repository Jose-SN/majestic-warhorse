import { ChangeDetectionStrategy, Component, EventEmitter, Input, input, Output } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { IModelInfo } from './model/popupmodel';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { DashboardService } from 'src/app/pages/dashboard/dashboard.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-common-dialog',
  standalone: true,
  imports: [CommonModule], // Include CommonModule for ngTemplateOutlet and other directives
  templateUrl: './common-dialog.component.html',
  styleUrl: './common-dialog.component.scss',
  animations: [
    trigger('dialogAnimation', [
      state('void', style({ transform: 'scale(0.9)', opacity: 0 })),
      transition(':enter', [
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'scale(0.9)', opacity: 0 })),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonDialogComponent {
  @Output() closed = new EventEmitter<boolean>();
  @Input() popupModelInfo: IModelInfo = {} as IModelInfo;
  public urlSafe!: SafeResourceUrl;
  @Input() templateRef: any; // Template reference for dynamic content
  constructor(
    private sanitizer: DomSanitizer, 
    private dashboardService: DashboardService, 
    private commonService: CommonService) {}
  ngOnInit() {
    if (!this.popupModelInfo) {
      throw new Error('popupModelInfo is required.');
    }
    if (this.popupModelInfo.isDynamicContent) {
      
      return;
    } else if (this.popupModelInfo.url) {
      const supportedExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
      const fileExtension = this.popupModelInfo.url.split('.').pop()?.toLowerCase();
      if (fileExtension && supportedExtensions.includes(fileExtension)) {
        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://view.officeapps.live.com/op/embed.aspx?src=${this.popupModelInfo.url}`
        );
      } else {
        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.popupModelInfo.url);
      }
    }
  }
  close(): void {
    if (this.popupModelInfo.isDynamicContent) {
      // this.dashboardService.setPopupChangeValue(false); // donnot close popup until student assigned teachers
      // show a snackbar that assign teacher to hide popup.
      this.commonService.openToaster({
        message: 'Assign teacher to close popup',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    } else {
      this.closed.emit(false);
    }
  }
}
