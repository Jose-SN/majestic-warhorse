import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { RosterDisplayUser, RosterDisplayService } from 'src/app/services/api-service/roster-display.service';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { ApproveTeacherService } from '../approval-list/approve-teacher.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-student-approval-list',
  standalone: true,
  imports: [CommonSearchProfileComponent, SearchFilterPipe],
  templateUrl: './student-approval-list.component.html',
  styleUrl: './student-approval-list.component.scss',
})
export class StudentApprovalListComponent implements OnInit, OnDestroy {
  public profileUrl: string = '';
  public mobMenu: boolean = false;
  public searchText: string = '';
  public showSliderView: boolean = false;
  public studentsList: RosterDisplayUser[] = [];
  public selectedStudents: string[] = [];
  private destroy$ = new Subject<void>();

  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;

  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    private dashboardService: DashboardService,
    private approveTeacherService: ApproveTeacherService,
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
    this.loadPendingStudents();
    this.dashboardService.getAllUsers();
  }

  getRosterRowId(student: RosterDisplayUser): string {
    return student.rosterRowId || '';
  }

  getStudentId(student: RosterDisplayUser): string {
    return this.getRosterRowId(student);
  }

  onStudentSelect(student: RosterDisplayUser, currentTarget: EventTarget | null) {
    const isChecked = (currentTarget as HTMLInputElement)?.checked ?? false;
    const rosterRowId = this.getRosterRowId(student);
    if (isChecked && rosterRowId) {
      if (!this.selectedStudents.includes(rosterRowId)) {
        this.selectedStudents.push(rosterRowId);
      }
    } else {
      const index = rosterRowId ? this.selectedStudents.indexOf(rosterRowId) : -1;
      if (index > -1) {
        this.selectedStudents.splice(index, 1);
      }
    }
  }

  loadPendingStudents() {
    const orgId = sessionStorage.getItem('organization_id') || '';
    if (!orgId) return;
    this.rosterDisplay.loadStudents(orgId, 'pending').then((students) => {
      this.studentsList = students;
    });
  }

  approveStudents() {
    if (!this.selectedStudents.length) return;
    this.approveTeacherService
      .approveStudents(this.selectedStudents)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedStudents = [];
          this.loadPendingStudents();
          this.commonService.openToaster({
            message: 'Students approved successfully!',
            messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
          });
        },
        error: () => {
          this.commonService.openToaster({
            message: 'Error while approving students!',
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
