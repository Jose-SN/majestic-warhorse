import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
})
export class DocumentViewerComponent {
  @Input() url!: string;
  public documentUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.documentUrl = this.sanitizeUrl(this.url);
  }
  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
