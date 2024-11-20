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
  @Output() videoDuration: EventEmitter<number> = new EventEmitter<number>();
  @Output() videoStatusUpdate: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('videoPlayer', { static: true }) videoPlayer!: ElementRef<HTMLVideoElement>;

  constructor(protected sanitizer: DomSanitizer) {}
  get getVideoTimeUpdate() {
    return {
      duration: this.videoPlayer.nativeElement.duration,
      currentTime: this.videoPlayer.nativeElement.currentTime,
    };
  }
  ngOnInit(): void {
    this.bypassSecurityTrustUrl(this.videoUrl['url']);
  }
  playVideo() {
    this.videoPlayer.nativeElement.play();
  }
  onPlay() {
    this.videoStatusUpdate.emit("PLAY");
  }
  onPause() {
    this.videoStatusUpdate.emit("PAUSE");
  }
  bypassSecurityTrustUrl(url: string) {
    this.sourceUrl = this.sanitizer.bypassSecurityTrustUrl(url);
  }
  setVideoDuration(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.videoDuration.emit(video.duration);
  }
  ngOnChanges() {
    this.bypassSecurityTrustUrl(this.videoUrl['url']);
  }
}
