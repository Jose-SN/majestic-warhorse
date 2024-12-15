import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class VideoDurationService {
  constructor() {}
  getVideoDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.onerror = () => {
        reject('Error loading video');
      };
    });
  }
}
