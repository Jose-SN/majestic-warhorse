import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { map, Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { RosterDisplayUser, RosterDisplayService } from 'src/app/services/api-service/roster-display.service';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { COMPONENT_NAME } from 'src/app/constants/popup-constants';

@Component({
  selector: 'app-teachers-list',
  standalone: true,
  imports: [CommonSearchProfileComponent, SearchFilterPipe],
  templateUrl: './teachers-list.component.html',
  styleUrl: './teachers-list.component.scss',
})
export class TeachersListComponent implements OnInit, OnDestroy {
  public profileUrl: string = '';
  public mobMenu: boolean = false;
  public showSliderView: boolean = false;
  public teachersList: RosterDisplayUser[] = [];
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
      this.rosterDisplay.loadTeachers(orgId, 'approved').then((teachers) => {
        this.teachersList = teachers;
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

  viewAssignedStudents(teacher: RosterDisplayUser) {
    this.commonService.openPopupModel({
      title: `Subscribed Students - ${teacher.firstName || teacher.first_name} ${teacher.lastName || teacher.last_name}`,
      data: teacher,
      componentName: COMPONENT_NAME.VIEW_ASSIGNED_STUDENTS,
      customStyle: { width: '800px', height: '800px', 'max-width': '90vw' },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
