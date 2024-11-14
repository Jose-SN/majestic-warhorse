import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
})
export class VideoPlayerComponent {
  public sourceUrl: SafeUrl | undefined;
  @Input() videoUrl!: { [key: string]: string };
  @Output() videoUration: EventEmitter<number> = new EventEmitter<number>();
  @ViewChild('videoPlayer', { static: true }) videoPlayer!: ElementRef<HTMLVideoElement>;

  constructor(protected sanitizer: DomSanitizer) {}
  ngOnInit(): void {
    this.bypassSecurityTrustUrl(this.videoUrl['url']);
  }
  playVideo() {
    this.videoPlayer.nativeElement.play();
  }
  onPlay() {}
  onPause() {}
  bypassSecurityTrustUrl(url: string) {
    this.sourceUrl = this.sanitizer.bypassSecurityTrustUrl(url);
  }
  setVideoDuration(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.videoUration.emit(video.duration);
  }
  ngOnChanges() {
    this.bypassSecurityTrustUrl(this.videoUrl['url']);
  }
}
