import { Component } from '@angular/core';

@Component({
  selector: 'app-attachment-accordion',
  standalone: true,
  imports: [],
  templateUrl: './attachment-accordion.component.html',
  styleUrl: './attachment-accordion.component.scss',
})
export class AttachmentAccordionComponent {
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
}
