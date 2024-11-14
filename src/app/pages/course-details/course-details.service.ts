import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CourseDetailsService {
  constructor() {}
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const hoursPart = hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : '';
    const minutesPart = minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : '';
    const secondsPart =
      remainingSeconds > 0 ? `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : '';
    return [hoursPart, minutesPart, secondsPart].filter(Boolean).join(' ').trim();
  }
}
