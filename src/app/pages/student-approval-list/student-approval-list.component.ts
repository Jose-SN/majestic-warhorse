import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { RosterDisplayUser, RosterDisplayService } from 'src/app/services/api-service/roster-display.service';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { ApproveTeacherService } from '../approval-list/approve-teacher.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-student-approval-list',
  standalone: true,
  imports: [SearchFilterPipe],
  templateUrl: './student-approval-list.component.html',
  styleUrl: './student-approval-list.component.scss',
})
export class StudentApprovalListComponent implements OnInit, OnDestroy {
  @Input() embedded = false;
  @HostBinding('class.approval-grid-page-host--embedded')
  get isEmbeddedHost(): boolean {
    return this.embedded;
  }

  public searchText: string = '';
  public studentsList: RosterDisplayUser[] = [];
  public selectedStudents: string[] = [];
  public displayedCount = 0;
  public rosterLoading = true;
  private destroy$ = new Subject<void>();
  private filteredStudents: RosterDisplayUser[] = [];

  constructor(
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
    void this.loadPendingStudents();
    this.dashboardService.getAllUsers();
  }

  getRosterRowId(student: RosterDisplayUser): string {
    return student.rosterRowId || '';
  }

  getStudentId(student: RosterDisplayUser): string {
    return this.getRosterRowId(student);
  }

  getStudentName(student: RosterDisplayUser): string {
    const first = student.firstName || student.first_name || '';
    const last = student.lastName || student.last_name || '';
    return `${first} ${last}`.trim() || 'Student';
  }

  getStudentEmail(student: RosterDisplayUser): string {
    return student.contact?.email || student.email || '';
  }

  getStudentAvatar(student: RosterDisplayUser): string {
    return this.commonService.decodeUrl((student.profileImage || student.profile_image) ?? '') as string;
  }

  getNodeId(student: RosterDisplayUser): string {
    const id = student.id || student.rosterRowId || '';
    if (!id) {
      return '#MX-0000';
    }
    const token = String(id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `#MX-${token.slice(-4).padStart(4, '0')}`;
  }

  isStudentSelected(student: RosterDisplayUser): boolean {
    return this.selectedStudents.includes(this.getStudentId(student));
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

  selectAllVisible(): void {
    const visibleIds = this.filteredStudents
      .map((student) => this.getStudentId(student))
      .filter((id) => !!id);
    this.selectedStudents = [...new Set([...this.selectedStudents, ...visibleIds])];
  }

  clearSelection(): void {
    this.selectedStudents = [];
  }

  async loadPendingStudents(): Promise<void> {
    this.rosterLoading = true;
    const orgId = sessionStorage.getItem('organization_id') || '';
    if (!orgId) {
      this.studentsList = [];
      this.rosterLoading = false;
      this.updateDisplayedCount();
      return;
    }

    try {
      this.studentsList = await this.rosterDisplay.loadStudents(orgId, 'pending');
    } catch {
      this.studentsList = [];
    } finally {
      this.rosterLoading = false;
      this.updateDisplayedCount();
    }
  }

  private updateDisplayedCount(): void {
    this.filteredStudents = this.filterStudents(this.studentsList, this.searchText);
    this.displayedCount = this.filteredStudents.length;
  }

  private filterStudents(
    students: RosterDisplayUser[],
    searchText: string
  ): RosterDisplayUser[] {
    const term = searchText?.trim().toLowerCase() ?? '';
    if (!term) {
      return students;
    }
    return students.filter((student) => {
      const fullName = `${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`
        .trim()
        .toLowerCase();
      return fullName.includes(term);
    });
  }

  approveStudents() {
    if (!this.selectedStudents.length) return;

    const recipients = this.studentsList
      .filter((student) => this.selectedStudents.includes(this.getRosterRowId(student)))
      .map((student) => ({
        rosterRowId: this.getRosterRowId(student),
        email: this.getStudentEmail(student),
        name: this.getStudentName(student),
      }));

    this.approveTeacherService
      .approveStudents(this.selectedStudents, recipients)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedStudents = [];
          void this.loadPendingStudents();
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
