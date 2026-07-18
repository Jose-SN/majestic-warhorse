import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { RosterDisplayUser, RosterDisplayService } from 'src/app/services/api-service/roster-display.service';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { ApproveTeacherService } from './approve-teacher.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-approval-list',
  standalone: true,
  imports: [SearchFilterPipe],
  templateUrl: './approval-list.component.html',
  styleUrl: './approval-list.component.scss',
})
export class ApprovalListComponent implements OnInit, OnDestroy {
  @Input() embedded = false;
  @HostBinding('class.approval-grid-page-host--embedded')
  get isEmbeddedHost(): boolean {
    return this.embedded;
  }

  public searchText: string = '';
  public teachersList: RosterDisplayUser[] = [];
  public selectedTeachers: string[] = [];
  public displayedCount = 0;
  public rosterLoading = true;
  private destroy$ = new Subject<void>();
  private filteredTeachers: RosterDisplayUser[] = [];

  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    private dashboardService: DashboardService,
    private approveTeacherService: ApproveTeacherService,
    private rosterDisplay: RosterDisplayService
  ) {
    this.commonService
      .getCommonSearchText()
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.searchText = searchText;
        this.updateDisplayedCount();
      });
  }

  ngOnInit(): void {
    void this.loadPendingTeachers();
    this.dashboardService.getAllUsers();
  }

  getRosterRowId(teacher: RosterDisplayUser): string {
    return teacher.rosterRowId || '';
  }

  getTeacherId(teacher: RosterDisplayUser): string {
    return this.getRosterRowId(teacher);
  }

  getTeacherName(teacher: RosterDisplayUser): string {
    const first = teacher.firstName || teacher.first_name || '';
    const last = teacher.lastName || teacher.last_name || '';
    return `${first} ${last}`.trim() || 'Instructor';
  }

  getTeacherEmail(teacher: RosterDisplayUser): string {
    return teacher.contact?.email || teacher.email || '';
  }

  getTeacherAvatar(teacher: RosterDisplayUser): string {
    return this.commonService.decodeUrl((teacher.profileImage || teacher.profile_image) ?? '') as string;
  }

  getNodeId(teacher: RosterDisplayUser): string {
    const id = teacher.id || teacher.rosterRowId || '';
    if (!id) {
      return '#MX-0000';
    }
    const token = String(id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `#MX-${token.slice(-4).padStart(4, '0')}`;
  }

  isTeacherSelected(teacher: RosterDisplayUser): boolean {
    return this.selectedTeachers.includes(this.getTeacherId(teacher));
  }

  onTeacherSelect(teacher: RosterDisplayUser, currentTarget: EventTarget | null) {
    const isChecked = (currentTarget as HTMLInputElement)?.checked ?? false;
    const rosterRowId = this.getRosterRowId(teacher);
    if (isChecked && rosterRowId) {
      if (!this.selectedTeachers.includes(rosterRowId)) {
        this.selectedTeachers.push(rosterRowId);
      }
    } else {
      const index = rosterRowId ? this.selectedTeachers.indexOf(rosterRowId) : -1;
      if (index > -1) {
        this.selectedTeachers.splice(index, 1);
      }
    }
  }

  selectAllVisible(): void {
    const visibleIds = this.filteredTeachers
      .map((teacher) => this.getTeacherId(teacher))
      .filter((id) => !!id);
    this.selectedTeachers = [...new Set([...this.selectedTeachers, ...visibleIds])];
  }

  clearSelection(): void {
    this.selectedTeachers = [];
  }

  async loadPendingTeachers(): Promise<void> {
    this.rosterLoading = true;
    const orgId = sessionStorage.getItem('organization_id') || '';
    if (!orgId) {
      this.teachersList = [];
      this.rosterLoading = false;
      this.updateDisplayedCount();
      return;
    }

    try {
      this.teachersList = await this.rosterDisplay.loadTeachers(orgId, 'pending');
    } catch {
      this.teachersList = [];
    } finally {
      this.rosterLoading = false;
      this.updateDisplayedCount();
    }
  }

  private updateDisplayedCount(): void {
    this.filteredTeachers = this.filterTeachers(this.teachersList, this.searchText);
    this.displayedCount = this.filteredTeachers.length;
  }

  private filterTeachers(
    teachers: RosterDisplayUser[],
    searchText: string
  ): RosterDisplayUser[] {
    const term = searchText?.trim().toLowerCase() ?? '';
    if (!term) {
      return teachers;
    }
    return teachers.filter((teacher) => {
      const fullName = `${teacher.firstName || teacher.first_name || ''} ${teacher.lastName || teacher.last_name || ''}`
        .trim()
        .toLowerCase();
      return fullName.includes(term);
    });
  }

  approveTeachers() {
    if (!this.selectedTeachers.length) return;
    this.approveTeacherService
      .approveTeachers(this.selectedTeachers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedTeachers = [];
          void this.loadPendingTeachers();
          this.commonService.openToaster({
            message: 'Teachers approved successfully!',
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
