import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { RosterDisplayUser, RosterDisplayService } from 'src/app/services/api-service/roster-display.service';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { COMPONENT_NAME } from 'src/app/constants/popup-constants';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonSearchProfileComponent, SearchFilterPipe],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss',
})
export class StudentsListComponent implements OnInit, OnDestroy {
  public profileUrl: string = '';
  public mobMenu: boolean = false;
  public studentList: RosterDisplayUser[] = [];
  public showSliderView: boolean = false;
  public searchText: string = '';
  private destroy$ = new Subject<void>();
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
    this.commonService
      .getCommonSearchText()
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.searchText = searchText;
      });
  }

  ngOnInit(): void {
    const orgId = sessionStorage.getItem('organization_id') || '';
    if (orgId) {
      this.rosterDisplay.loadStudents(orgId, 'active').then((students) => {
        this.studentList = students;
      });
    }
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

  viewAssignedTeachers(student: RosterDisplayUser) {
    this.commonService.openPopupModel({
      title: `Assigned Teachers - ${student.firstName || student.first_name} ${student.lastName || student.last_name}`,
      data: student,
      componentName: COMPONENT_NAME.VIEW_ASSIGNED_TEACHERS,
      customStyle: { width: '800px', height: '800px', 'max-width': '90vw' },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
