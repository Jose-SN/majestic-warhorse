import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { CommonSliderComponent } from 'src/app/components/common-slider/common-slider.component';
import { DashboardService } from '../dashboard/dashboard.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { UserModel } from '../login-page/model/user-model';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { ApproveTeacherService } from './approve-teacher.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { CommonApiService } from 'src/app/shared/api-service/common-api.service';

@Component({
  selector: 'app-approval-list',
  standalone: true,
  imports: [CommonSearchProfileComponent, SearchFilterPipe],
  templateUrl: './approval-list.component.html',
  styleUrl: './approval-list.component.scss',
})
export class ApprovalListComponent {
  public profileUrl: string = '';
  public mobMenu: boolean = false;
  public searchText: string = '';
  public showSliderView: boolean = false;
  public teachersList: UserModel[] = [];
  public selectedTeachers: string[] = [];
  private destroy$ = new Subject<void>();

  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    private dashboardService: DashboardService,
    private commonApiService: CommonApiService,
    private approveTeacherService: ApproveTeacherService
  ) {
    this.profileUrl = this.commonService.decodeUrl(
      (this.commonService.loginedUserInfo.profileImage || this.commonService.loginedUserInfo.profile_image) ?? ''
    );
    this.getApprovalPendingTeachers();
    this.commonService
      .getCommonSearchText()
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.searchText = searchText;
      });
  }
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }

  logOut() {
    this.authService.logOutApplication();
  }
  sliderActiveRemove(): void {
    this.showSliderView = false;
  }
  getTeacherId(teacher: UserModel): string {
    return teacher.id || '';
  }
  
  onTeacherSelect(teacher: UserModel, currentTarget: any) {
    const isChecked = currentTarget?.checked ?? false;
    const teacherId = this.getTeacherId(teacher);
    if (isChecked && teacherId) {
      if (!this.selectedTeachers.includes(teacherId)) {
        this.selectedTeachers.push(teacherId);
      }
    } else {
      const index = teacherId ? this.selectedTeachers.indexOf(teacherId) : -1;
      if (index > -1) {
        this.selectedTeachers.splice(index, 1);
      }
    }
  }
  getApprovalPendingTeachers() {
    this.teachersList = this.commonService.allUsersList.filter((users) => {
      return users.role === 'teacher' && !users.approved;
    });
  }
  approveTeachers() {
    const approvePayload = this.selectedTeachers.map((teacherId: string) => {
      return { id: teacherId, approved: true };
    });
    this.approveTeacherService
      .approveTeachers(approvePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.commonService.allUsersList.forEach((user: UserModel) => {
            const userId = this.getTeacherId(user);
            if (userId && this.selectedTeachers.includes(userId)) {
              user.approved = true;
            }
          });
          this.selectedTeachers = [];
          this.getApprovalPendingTeachers();
          this.commonService.openToaster({
            message: 'Teachers approval successfully done!',
            messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
          });
        },
        error: () => {
          this.commonService.openToaster({
            message: 'Error while approving teachers!',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        },
      });
  }
  deleteTeacher(deletedTeacher: UserModel) {
    this.commonApiService.deleteUser(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        this.commonService.openToaster({
          message: `Teacher ${deletedTeacher.firstName} ${deletedTeacher.lastName} successfully deleted`,
          messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
        });
        this.commonService.alluserList = await this.authService.getAllUsers();
      },
      error: () => {
        this.commonService.openToaster({
          message: `Error while deleting Teacher ${deletedTeacher.firstName} ${deletedTeacher.lastName}`,
          messageType: TOASTER_MESSAGE_TYPE.ERROR,
        });
      },
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
