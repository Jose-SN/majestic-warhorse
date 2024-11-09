import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChapterDetail, FileDetail, ICourseList } from '../courses/modal/course-list';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';

@Component({
  selector: 'app-course-detils',
  standalone: true,
  imports: [FormsModule, CommonModule, VideoPlayerComponent],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.scss',
})
export class CourseDetailsComponent {
  public mobMenu: boolean = false;
  public activeVideoUrl: string = '';
  public activeChapter: ChapterDetail = {} as ChapterDetail;
  @Input() selectedCourseInfo: ICourseList = {} as ICourseList;
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  @ViewChild(VideoPlayerComponent) videoPlayerComponent!: VideoPlayerComponent;

  ngOnInit(): void {
    this.setDefaultVideo();
  }
  setDefaultVideo() {
    this.activeVideoUrl = this.selectedCourseInfo?.chapterDetails?.[0]?.fileDetails?.[0]?.fileURL;
  }
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }

  openAccordian(event: any, chapterDetails: ChapterDetail) {
    this.activeChapter = chapterDetails;
    const element = event.target;
    // element.classList.toggle('active'); // need to work
    const panel = element.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }
  changeVideoUrl(fileDetails: FileDetail) {
    this.activeVideoUrl = fileDetails.fileURL;
  }
  handleStartAssessment(){
    this.videoPlayerComponent.playVideo();
  }
}
