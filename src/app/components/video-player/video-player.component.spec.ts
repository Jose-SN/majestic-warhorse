import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoPlayerComponent } from './video-player.component';

describe('VideoPlayerComponent', () => {
  let component: VideoPlayerComponent;
  let fixture: ComponentFixture<VideoPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoPlayerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoPlayerComponent);
    component = fixture.componentInstance;
    component.videoUrl = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should embed YouTube links', () => {
    expect(component.mode).toBe('youtube');
    expect(component.providerLabel).toBe('YouTube');
  });

  it('should embed Vimeo links', () => {
    component.videoUrl = 'https://vimeo.com/123456789';
    expect(component.mode).toBe('vimeo');
    expect(component.providerLabel).toBe('Vimeo');
  });

  it('should open Zoom as an external link', () => {
    component.videoUrl = 'https://us02web.zoom.us/j/123456789';
    expect(component.mode).toBe('external');
    expect(component.providerLabel).toBe('Zoom meeting');
  });

  it('should play direct video files in a video element', () => {
    component.videoUrl = 'https://cdn.example.com/lesson.mp4';
    expect(component.mode).toBe('file');
  });
});
