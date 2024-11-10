import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChapterDetail, FileDetail, ICourseList } from '../courses/modal/course-list';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-course-detils',
  standalone: true,
  imports: [FormsModule, CommonModule, VideoPlayerComponent],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.scss',
})
export class CourseDetailsComponent {
  public mobMenu: boolean = false;
  public profileUrl: string = '';
  public activeVideoUrl: string = '';
  public activeVideoDescription: string = '';
  public activeChapter: ChapterDetail = {} as ChapterDetail;
  @Input() selectedCourseInfo: ICourseList = {} as ICourseList;
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  @ViewChild(VideoPlayerComponent) videoPlayerComponent!: VideoPlayerComponent;
  constructor(
    private authService: AuthService,
    private commonService: CommonService
  ) {
    this.profileUrl = this.commonService.loginedUserInfo.profileImage ?? '';
  }
  ngOnInit(): void {
    this.setDefaultVideo();
  }
  setDefaultVideo() {
    this.activeChapter = this.selectedCourseInfo?.chapterDetails[0];
    this.activeVideoUrl = this.selectedCourseInfo?.chapterDetails?.[0]?.fileDetails?.[0]?.fileURL;
    this.activeVideoDescription =
      this.selectedCourseInfo?.chapterDetails?.[0]?.fileDetails?.[0]?.description;
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
    this.activeVideoDescription = fileDetails.description;
  }
  handleStartAssessment() {
    this.videoPlayerComponent.playVideo();
  }
  logOut() {
    this.authService.logOutApplication();
  }
}
