import { Component, Input } from '@angular/core';
import { IModelInfo } from '../common-dialog/model/popupmodel';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-file-viwer',
  standalone: true,
  imports: [],
  templateUrl: './file-viwer.component.html',
  styleUrl: './file-viwer.component.scss',
})
export class FileViwerComponent {
  @Input() popupModelInfo: IModelInfo = {} as IModelInfo;
  public urlSafe!: SafeResourceUrl;
  constructor(private sanitizer: DomSanitizer) {}
  ngOnInit() {
    if (this.popupModelInfo.url) {
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
}
