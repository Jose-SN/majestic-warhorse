import { Component, ElementRef, ViewChild } from '@angular/core';
import { UserModel } from '../login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { COMPONENT_NAME } from 'src/app/constants/popup-constants';
import { Subject, takeUntil } from 'rxjs';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { CommonApiService } from 'src/app/shared/api-service/common-api.service';

@Component({
  selector: 'app-student-teacher-assign-list',
  standalone: true,
  imports: [CommonSearchProfileComponent, SearchFilterPipe],
  templateUrl: './student-teacher-assign-list.component.html',
  styleUrl: './student-teacher-assign-list.component.scss',
})
export class StudentTeacherAssignListComponent {
  public profileUrl: string = '';
  public mobMenu: boolean = false;
  public studentList: UserModel[] = [];
  public showSliderView: boolean = false;
  private destroy$ = new Subject<void>();
  private editedStudent: UserModel = {} as UserModel;
  public searchText: string = '';
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    private commonApiService: CommonApiService,
    private dashboardService: DashboardService
  ) {
    this.profileUrl = this.commonService.decodeUrl(this.commonService.loginedUserInfo.profileImage ?? '')
    this.getStudentList();
  }
  ngOnInit() {
    this.commonService
      .closePopupModelHandle()
      .pipe(takeUntil(this.destroy$))
      .subscribe((closeModel) => {
        this.commonService.allUsersList.forEach((student) => {
          if (student._id === this.editedStudent._id) {
            student.approved = true;
          }
        });
        this.getStudentList();
      });
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
  getStudentList() {
    this.studentList = this.commonService.allUsersList.filter(
      (users) => users.role === 'student' && !users.approved
    );
  }
  assignTeacher(selectedStudent: UserModel) {
    this.editedStudent = selectedStudent;
    this.commonService.openPopupModel({
      data: selectedStudent,
      title: 'Assign Teachers',
      componentName: COMPONENT_NAME.ASSIGN_TEACHER,
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
}
