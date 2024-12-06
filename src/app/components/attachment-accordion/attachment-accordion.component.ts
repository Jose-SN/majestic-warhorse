import { Component, Input } from '@angular/core';
import { COMPONENT_NAME } from 'src/app/constants/popup-constants';
import { IAttachmentObjectInfo } from 'src/app/pages/course-upload/model/file-object-info';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-attachment-accordion',
  standalone: true,
  imports: [],
  templateUrl: './attachment-accordion.component.html',
  styleUrl: './attachment-accordion.component.scss',
})
export class AttachmentAccordionComponent {
  @Input() attachmentList: IAttachmentObjectInfo[] = [];
  toggleAccordian(event: any, index: any) {
    const element = event.target;
    element.classList.toggle('active');
    const panel = element.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }
  constructor(private commonService: CommonService) {}
  previewDocument(attachment: IAttachmentObjectInfo) {
    this.commonService.openPopupModel({
      data: attachment,
      title: attachment.name,
      fileType: 'ATTACHMENT',
      url: attachment.fileURL,
      componentName: COMPONENT_NAME.FILE_VIEWER,
    });
  }
}
