import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { RosterDisplayUser, RosterDisplayService } from 'src/app/services/api-service/roster-display.service';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { DASHBOARD_NAV_ROUTES } from '../dashboard/dashboard-routes.config';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [SearchFilterPipe],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss',
})
export class StudentsListComponent implements OnInit, OnDestroy {
  @Input() embedded = false;
  @HostBinding('class.approval-grid-page-host--embedded')
  get isEmbeddedHost(): boolean {
    return this.embedded;
  }

  public studentList: RosterDisplayUser[] = [];
  public searchText: string = '';
  public displayedCount = 0;
  public rosterLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    public commonService: CommonService,
    private dashboardService: DashboardService,
    private rosterDisplay: RosterDisplayService,
    private router: Router
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
    void this.loadStudents();
    this.dashboardService.getAllUsers();
  }

  private async loadStudents(): Promise<void> {
    this.rosterLoading = true;
    const orgId = sessionStorage.getItem('organization_id') || '';
    if (!orgId) {
      this.studentList = [];
      this.rosterLoading = false;
      this.updateDisplayedCount();
      return;
    }

    try {
      this.studentList = await this.rosterDisplay.loadStudents(orgId, 'active');
    } catch {
      this.studentList = [];
    } finally {
      this.rosterLoading = false;
      this.updateDisplayedCount();
    }
  }

  getStudentName(student: RosterDisplayUser): string {
    const first = student.firstName || student.first_name || '';
    const last = student.lastName || student.last_name || '';
    const fullName = `${first} ${last}`.trim();
    return fullName || student.name?.trim() || 'Student';
  }

  getStudentEmail(student: RosterDisplayUser): string {
    return student.contact?.email || student.email || '';
  }

  getStudentAvatar(student: RosterDisplayUser): string {
    const raw = this.commonService.decodeUrl((student.profileImage || student.profile_image) ?? '') as string;
    if (raw?.trim()) {
      return raw;
    }

    const label = this.getStudentName(student);
    const email = this.getStudentEmail(student);
    const name = label !== 'Student' ? label : email || 'Student';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b2c&color=fff&size=128`;
  }

  getNodeId(student: RosterDisplayUser): string {
    const id = student.id || student.rosterRowId || '';
    if (!id) {
      return '#MX-0000';
    }
    const token = String(id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `#MX-${token.slice(-4).padStart(4, '0')}`;
  }

  viewAssignedTeachers(student: RosterDisplayUser) {
    const studentId = student.id || student.rosterRowId;
    if (!studentId) {
      return;
    }

    void this.router.navigate([DASHBOARD_NAV_ROUTES.manageStudentTeachers(studentId)]);
  }

  private updateDisplayedCount(): void {
    this.displayedCount = this.filterStudents(this.studentList, this.searchText).length;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
