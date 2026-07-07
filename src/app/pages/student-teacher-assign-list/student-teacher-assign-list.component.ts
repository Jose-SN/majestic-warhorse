import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UserModel } from '../login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { COMPONENT_NAME } from 'src/app/constants/popup-constants';
import { Subject, takeUntil } from 'rxjs';
import { RosterDisplayUser, RosterDisplayService } from 'src/app/services/api-service/roster-display.service';

@Component({
  selector: 'app-student-teacher-assign-list',
  standalone: true,
  imports: [CommonSearchProfileComponent, SearchFilterPipe],
  templateUrl: './student-teacher-assign-list.component.html',
  styleUrl: './student-teacher-assign-list.component.scss',
})
export class StudentTeacherAssignListComponent implements OnInit, OnDestroy {
  public profileUrl: string = '';
  public mobMenu: boolean = false;
  public studentList: RosterDisplayUser[] = [];
  public showSliderView: boolean = false;
  private destroy$ = new Subject<void>();
  private editedStudent: RosterDisplayUser = {} as RosterDisplayUser;
  public searchText: string = '';
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;

  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    private dashboardService: DashboardService,
    private rosterDisplay: RosterDisplayService
  ) {
    this.profileUrl = this.commonService.decodeUrl(
      (this.commonService.loginedUserInfo.profileImage ||
        this.commonService.loginedUserInfo.profile_image) ??
        ''
    );
    this.loadApprovedStudents();
  }

  ngOnInit() {
    this.commonService
      .closePopupModelHandle()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadApprovedStudents();
      });
    this.commonService
      .getCommonSearchText()
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.searchText = searchText;
      });
    this.dashboardService.getAllUsers();
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

  getStudentId(student: RosterDisplayUser): string {
    return student.id || '';
  }

  loadApprovedStudents() {
    const orgId = sessionStorage.getItem('organization_id') || '';
    if (!orgId) return;
    this.rosterDisplay.loadStudents(orgId, 'approved').then((students) => {
      this.studentList = students;
    });
  }

  assignTeacher(selectedStudent: RosterDisplayUser) {
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
}
