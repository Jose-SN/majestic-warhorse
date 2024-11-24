import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FileDownloadApiService } from 'src/app/services/api-service/file-download-api.service';

@Injectable({
  providedIn: 'root',
})
export class FileDownloadService {
  constructor(
    private http: HttpClient,
    private fileDownloadApiService: FileDownloadApiService
  ) {}
  downloadFile(url: string, fileName: string, destroy$: Subject<void>) {
    this.fileDownloadApiService
      .getBlobFile({ fileUrl: url })
      .pipe(takeUntil(destroy$))
      .subscribe((blob: any) => {
        const downloadUrl = window.URL.createObjectURL(blob.body);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      });
  }
}
