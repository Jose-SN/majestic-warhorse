import { Component, EventEmitter, Input, input, Output } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { IModelInfo } from './model/popupmodel';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-common-dialog',
  standalone: true,
  imports: [],
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
})
export class CommonDialogComponent {
  @Output() closed = new EventEmitter<boolean>();
  @Input() popupModelInfo: IModelInfo = {} as IModelInfo;
  public urlSafe!: SafeResourceUrl;
  constructor(private sanitizer: DomSanitizer) {}
  ngOnInit() {
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
  close(): void {
    this.closed.emit(false);
  }
}
