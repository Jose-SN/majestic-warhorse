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
import { CommonApiService } from 'src/app/shared/api-service/common-api.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonSearchProfileComponent, SearchFilterPipe],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss',
})
export class StudentsListComponent {
  public profileUrl: string = '';
  public mobMenu: boolean = false;
  public studentList: UserModel[] = [];
  public showSliderView: boolean = false;
  public searchText: string = '';
  private destroy$ = new Subject<void>();
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    private commonApiService: CommonApiService,
    private dashboardService: DashboardService
  ) {
    this.profileUrl = this.commonService.decodeUrl(this.commonService.loginedUserInfo.profileImage ?? '')
    this.studentList = this.commonService.allUsersList.filter(
      (users) => users.role === 'student' && users.approved
    );
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
  seachTextHandler(searchText: string) {
    this.searchText = searchText;
  }
  deleteStudent(deletedStudent: UserModel) {
    this.commonApiService.deleteUser(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        this.commonService.openToaster({
          message: `Student ${deletedStudent.firstName} ${deletedStudent.lastName} successfully deleted`,
          messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
        });
        this.commonService.alluserList = await this.authService.getAllUsers();
      },
      error: () => {
        this.commonService.openToaster({
          message: `Error while deleting Student ${deletedStudent.firstName} ${deletedStudent.lastName}`,
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
