import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

export type VideoPlayerMode = 'file' | 'youtube' | 'vimeo' | 'embed' | 'external';

type YtPlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
};

type YtPlayerStateChangeEvent = { data: number };

type VimeoPlayerLike = {
  on: (event: string, cb: (...args: any[]) => void) => void;
  off?: (event: string, cb?: (...args: any[]) => void) => void;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  destroy: () => Promise<void> | void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        config: {
          events?: {
            onReady?: (event: { target: YtPlayer }) => void;
            onStateChange?: (event: YtPlayerStateChangeEvent) => void;
          };
        }
      ) => YtPlayer;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
    Vimeo?: {
      Player: new (element: HTMLElement | string) => VimeoPlayerLike;
    };
  }
}

const YT_API_SRC = 'https://www.youtube.com/iframe_api';
const VIMEO_API_SRC = 'https://player.vimeo.com/api/player.js';

let ytApiPromise: Promise<void> | null = null;
let vimeoApiPromise: Promise<void> | null = null;

function loadScriptOnce(src: string, isReady: () => boolean): Promise<void> {
  if (isReady()) {
    return Promise.resolve();
  }
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      if (isReady()) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve();
  }
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      loadScriptOnce(YT_API_SRC, () => Boolean(window.YT?.Player)).catch(reject);
      // API may already be present if script cached mid-load
      const started = Date.now();
      const poll = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(poll);
          resolve();
        } else if (Date.now() - started > 15000) {
          window.clearInterval(poll);
          reject(new Error('YouTube API load timeout'));
        }
      }, 50);
    });
  }
  return ytApiPromise;
}

function loadVimeoApi(): Promise<void> {
  if (window.Vimeo?.Player) {
    return Promise.resolve();
  }
  if (!vimeoApiPromise) {
    vimeoApiPromise = loadScriptOnce(VIMEO_API_SRC, () => Boolean(window.Vimeo?.Player)).then(
      () => undefined
    );
  }
  return vimeoApiPromise;
}

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
})
export class VideoPlayerComponent implements AfterViewChecked, OnDestroy {
  mode: VideoPlayerMode = 'file';
  providerLabel = 'External link';
  rawUrl = '';
  sourceUrl: SafeUrl | undefined;
  embedUrl: SafeResourceUrl | undefined;
  iframePlayerId = `vp-frame-${Math.random().toString(36).slice(2, 10)}`;

  @Output() videoDuration: EventEmitter<number> = new EventEmitter<number>();
  @Output() videoStatusUpdate: EventEmitter<string> = new EventEmitter<string>();
  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;
  @ViewChild('apiFrame') apiFrame?: ElementRef<HTMLIFrameElement>;

  private lastResolvedUrl = '';
  private pendingPlayerInit = false;
  private ytPlayer: YtPlayer | null = null;
  private vimeoPlayer: VimeoPlayerLike | null = null;
  private trackedCurrentTime = 0;
  private trackedDuration = 0;
  private forceComplete = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private initToken = 0;
  private destroyed = false;

  constructor(private readonly sanitizer: DomSanitizer) {}

  @Input()
  set videoUrl(value: string | { [key: string]: string } | null | undefined) {
    const url = typeof value === 'string' ? value : value?.['url'] ?? '';
    this.resolveSource(url?.trim() ?? '');
  }

  get getVideoTimeUpdate() {
    if (this.mode === 'file') {
      const el = this.videoPlayer?.nativeElement;
      if (!el) {
        return { duration: 0, currentTime: 0 };
      }
      return {
        duration: Number.isFinite(el.duration) ? el.duration : 0,
        currentTime: Number.isFinite(el.currentTime) ? el.currentTime : 0,
      };
    }

    if (this.mode === 'youtube' || this.mode === 'vimeo') {
      const duration = this.trackedDuration > 0 ? this.trackedDuration : 0;
      const currentTime = this.forceComplete && duration > 0 ? duration : this.trackedCurrentTime;
      return { duration, currentTime };
    }

    return { duration: 0, currentTime: 0 };
  }

  ngAfterViewChecked(): void {
    if (!this.pendingPlayerInit || this.destroyed) {
      return;
    }
    if ((this.mode === 'youtube' || this.mode === 'vimeo') && this.apiFrame?.nativeElement) {
      this.pendingPlayerInit = false;
      void this.initTrackedPlayer();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.teardownTrackedPlayer();
  }

  playVideo() {
    if (this.mode === 'file') {
      void this.videoPlayer?.nativeElement?.play();
      return;
    }
    if (this.rawUrl) {
      window.open(this.rawUrl, '_blank', 'noopener,noreferrer');
    }
  }

  openExternal() {
    if (this.rawUrl) {
      window.open(this.rawUrl, '_blank', 'noopener,noreferrer');
      this.videoStatusUpdate.emit('PLAY');
    }
  }

  onPlay() {
    this.videoStatusUpdate.emit('PLAY');
  }

  onPause() {
    this.videoStatusUpdate.emit('PAUSE');
  }

  onEnded() {
    this.forceComplete = true;
    this.videoStatusUpdate.emit('ENDED');
  }

  setVideoDuration(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (Number.isFinite(video.duration)) {
      this.videoDuration.emit(video.duration);
    }
  }

  private resolveSource(url: string): void {
    if (!url || url === this.lastResolvedUrl) {
      return;
    }
    this.teardownTrackedPlayer();
    this.lastResolvedUrl = url;
    this.rawUrl = url;
    this.sourceUrl = undefined;
    this.embedUrl = undefined;
    this.trackedCurrentTime = 0;
    this.trackedDuration = 0;
    this.forceComplete = false;
    this.iframePlayerId = `vp-frame-${Math.random().toString(36).slice(2, 10)}`;

    const youtubeId = this.extractYouTubeId(url);
    if (youtubeId) {
      this.mode = 'youtube';
      this.providerLabel = 'YouTube';
      const origin = encodeURIComponent(window.location.origin);
      this.embedUrl = this.trustResource(
        `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1&origin=${origin}`
      );
      this.pendingPlayerInit = true;
      return;
    }

    const vimeoId = this.extractVimeoId(url);
    if (vimeoId) {
      this.mode = 'vimeo';
      this.providerLabel = 'Vimeo';
      this.embedUrl = this.trustResource(`https://player.vimeo.com/video/${vimeoId}`);
      this.pendingPlayerInit = true;
      return;
    }

    const loomId = this.extractLoomId(url);
    if (loomId) {
      this.mode = 'embed';
      this.providerLabel = 'Loom';
      this.embedUrl = this.trustResource(`https://www.loom.com/embed/${loomId}`);
      return;
    }

    const driveId = this.extractGoogleDriveId(url);
    if (driveId) {
      this.mode = 'embed';
      this.providerLabel = 'Google Drive';
      this.embedUrl = this.trustResource(`https://drive.google.com/file/d/${driveId}/preview`);
      return;
    }

    if (this.isZoomUrl(url)) {
      this.mode = 'external';
      this.providerLabel = this.isZoomRecording(url) ? 'Zoom recording' : 'Zoom meeting';
      return;
    }

    if (this.isDirectVideoUrl(url)) {
      this.mode = 'file';
      this.providerLabel = 'Video';
      this.sourceUrl = this.sanitizer.bypassSecurityTrustUrl(url);
      return;
    }

    if (this.isHttpUrl(url)) {
      this.mode = 'embed';
      this.providerLabel = this.hostLabel(url);
      this.embedUrl = this.trustResource(url);
      return;
    }

    this.mode = 'external';
    this.providerLabel = 'External link';
  }

  private async initTrackedPlayer(): Promise<void> {
    const token = ++this.initToken;
    const frame = this.apiFrame?.nativeElement;
    if (!frame || this.destroyed) {
      return;
    }

    try {
      if (this.mode === 'youtube') {
        await loadYouTubeApi();
        if (token !== this.initToken || this.destroyed) {
          return;
        }
        this.ytPlayer = new window.YT!.Player(frame, {
          events: {
            onReady: (event) => {
              if (token !== this.initToken || this.destroyed) {
                return;
              }
              const duration = event.target.getDuration();
              if (Number.isFinite(duration) && duration > 0) {
                this.trackedDuration = duration;
                this.videoDuration.emit(duration);
              }
            },
            onStateChange: (event) => this.onYouTubeStateChange(event),
          },
        });
        return;
      }

      if (this.mode === 'vimeo') {
        await loadVimeoApi();
        if (token !== this.initToken || this.destroyed) {
          return;
        }
        const player = new window.Vimeo!.Player(frame);
        this.vimeoPlayer = player;

        const duration = await player.getDuration();
        if (token !== this.initToken || this.destroyed) {
          return;
        }
        if (Number.isFinite(duration) && duration > 0) {
          this.trackedDuration = duration;
          this.videoDuration.emit(duration);
        }

        player.on('play', () => {
          this.startProgressPoll();
          this.videoStatusUpdate.emit('PLAY');
        });
        player.on('pause', () => {
          void this.syncVimeoTime().then(() => this.videoStatusUpdate.emit('PAUSE'));
        });
        player.on('ended', () => {
          this.stopProgressPoll();
          this.forceComplete = true;
          if (this.trackedDuration > 0) {
            this.trackedCurrentTime = this.trackedDuration;
          }
          this.videoStatusUpdate.emit('ENDED');
        });
        player.on('timeupdate', (data: { seconds?: number; duration?: number }) => {
          if (typeof data?.seconds === 'number') {
            this.trackedCurrentTime = data.seconds;
          }
          if (typeof data?.duration === 'number' && data.duration > 0) {
            this.trackedDuration = data.duration;
          }
        });
      }
    } catch {
      // Keep plain iframe playback if API wiring fails.
    }
  }

  private onYouTubeStateChange(event: YtPlayerStateChangeEvent): void {
    const states = window.YT?.PlayerState;
    if (!states) {
      return;
    }
    this.syncYouTubeTime();

    if (event.data === states.PLAYING) {
      this.startProgressPoll();
      this.videoStatusUpdate.emit('PLAY');
      return;
    }

    if (event.data === states.PAUSED) {
      this.stopProgressPoll();
      this.syncYouTubeTime();
      this.videoStatusUpdate.emit('PAUSE');
      return;
    }

    if (event.data === states.ENDED) {
      this.stopProgressPoll();
      this.forceComplete = true;
      this.syncYouTubeTime();
      if (this.trackedDuration > 0) {
        this.trackedCurrentTime = this.trackedDuration;
      }
      this.videoStatusUpdate.emit('ENDED');
    }
  }

  private syncYouTubeTime(): void {
    if (!this.ytPlayer) {
      return;
    }
    try {
      const current = this.ytPlayer.getCurrentTime();
      const duration = this.ytPlayer.getDuration();
      if (Number.isFinite(current)) {
        this.trackedCurrentTime = current;
      }
      if (Number.isFinite(duration) && duration > 0) {
        this.trackedDuration = duration;
      }
    } catch {
      // Player may be mid-destroy.
    }
  }

  private async syncVimeoTime(): Promise<void> {
    if (!this.vimeoPlayer) {
      return;
    }
    try {
      const [current, duration] = await Promise.all([
        this.vimeoPlayer.getCurrentTime(),
        this.vimeoPlayer.getDuration(),
      ]);
      if (Number.isFinite(current)) {
        this.trackedCurrentTime = current;
      }
      if (Number.isFinite(duration) && duration > 0) {
        this.trackedDuration = duration;
      }
    } catch {
      // Player may be mid-destroy.
    }
  }

  private startProgressPoll(): void {
    this.stopProgressPoll();
    this.pollTimer = setInterval(() => {
      if (this.mode === 'youtube') {
        this.syncYouTubeTime();
      } else if (this.mode === 'vimeo') {
        void this.syncVimeoTime();
      }
    }, 1000);
  }

  private stopProgressPoll(): void {
    if (this.pollTimer != null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private teardownTrackedPlayer(): void {
    this.pendingPlayerInit = false;
    this.initToken += 1;
    this.stopProgressPoll();

    if (this.ytPlayer) {
      try {
        this.ytPlayer.destroy();
      } catch {
        // ignore
      }
      this.ytPlayer = null;
    }

    if (this.vimeoPlayer) {
      try {
        void this.vimeoPlayer.destroy();
      } catch {
        // ignore
      }
      this.vimeoPlayer = null;
    }
  }

  private trustResource(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private isHttpUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  private isDirectVideoUrl(url: string): boolean {
    if (/^(blob:|data:video\/)/i.test(url)) {
      return true;
    }
    const path = url.split('?')[0].split('#')[0].toLowerCase();
    return /\.(mp4|webm|ogg|ogv|mov|m4v|m3u8|mkv)(\/)?$/i.test(path);
  }

  private isZoomUrl(url: string): boolean {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host === 'zoom.us' || host.endsWith('.zoom.us');
    } catch {
      return /zoom\.us/i.test(url);
    }
  }

  private isZoomRecording(url: string): boolean {
    return /\/rec\//i.test(url);
  }

  private hostLabel(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./i, '');
    } catch {
      return 'External video';
    }
  }

  private extractYouTubeId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

      if (host === 'youtu.be') {
        const id = parsed.pathname.split('/').filter(Boolean)[0];
        return id || null;
      }

      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        if (parsed.pathname === '/watch') {
          return parsed.searchParams.get('v');
        }
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live' || parts[0] === 'v') {
          return parts[1] || null;
        }
      }

      if (host.endsWith('youtube-nocookie.com') && parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/')[2] || null;
      }
    } catch {
      // fall through
    }
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
    );
    return match?.[1] ?? null;
  }

  private extractVimeoId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
      if (host === 'player.vimeo.com') {
        const parts = parsed.pathname.split('/').filter(Boolean);
        return parts[0] === 'video' ? parts[1] || null : null;
      }
      if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
        const parts = parsed.pathname.split('/').filter(Boolean);
        const id = parts.find((part) => /^\d+$/.test(part));
        return id || null;
      }
    } catch {
      // fall through
    }
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    return match?.[1] ?? null;
  }

  private extractLoomId(url: string): string | null {
    const match = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
    return match?.[1] ?? null;
  }

  private extractGoogleDriveId(url: string): string | null {
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if (fileMatch?.[1]) {
      return fileMatch[1];
    }
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('drive.google.com')) {
        return parsed.searchParams.get('id');
      }
    } catch {
      // ignore
    }
    return null;
  }
}
