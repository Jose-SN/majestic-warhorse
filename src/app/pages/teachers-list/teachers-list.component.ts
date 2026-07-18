import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { RosterDisplayUser, RosterDisplayService } from 'src/app/services/api-service/roster-display.service';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { DASHBOARD_NAV_ROUTES } from '../dashboard/dashboard-routes.config';

@Component({
  selector: 'app-teachers-list',
  standalone: true,
  imports: [SearchFilterPipe],
  templateUrl: './teachers-list.component.html',
  styleUrl: './teachers-list.component.scss',
})
export class TeachersListComponent implements OnInit, OnDestroy {
  @Input() embedded = false;
  @HostBinding('class.approval-grid-page-host--embedded')
  get isEmbeddedHost(): boolean {
    return this.embedded;
  }

  public teachersList: RosterDisplayUser[] = [];
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
    void this.loadTeachers();
    this.dashboardService.getAllUsers();
  }

  private async loadTeachers(): Promise<void> {
    this.rosterLoading = true;
    const orgId = sessionStorage.getItem('organization_id') || '';
    if (!orgId) {
      this.teachersList = [];
      this.rosterLoading = false;
      this.updateDisplayedCount();
      return;
    }

    try {
      this.teachersList = await this.rosterDisplay.loadTeachers(orgId, 'active');
    } catch {
      this.teachersList = [];
    } finally {
      this.rosterLoading = false;
      this.updateDisplayedCount();
    }
  }

  getTeacherName(teacher: RosterDisplayUser): string {
    const first = teacher.firstName || teacher.first_name || '';
    const last = teacher.lastName || teacher.last_name || '';
    const fullName = `${first} ${last}`.trim();
    return fullName || teacher.name?.trim() || 'Instructor';
  }

  getTeacherEmail(teacher: RosterDisplayUser): string {
    return teacher.contact?.email || teacher.email || '';
  }

  getTeacherAvatar(teacher: RosterDisplayUser): string {
    const raw = this.commonService.decodeUrl((teacher.profileImage || teacher.profile_image) ?? '') as string;
    if (raw?.trim()) {
      return raw;
    }

    const label = this.getTeacherName(teacher);
    const email = this.getTeacherEmail(teacher);
    const name = label !== 'Instructor' ? label : email || 'Instructor';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b2c&color=fff&size=128`;
  }

  getNodeId(teacher: RosterDisplayUser): string {
    const id = teacher.id || teacher.rosterRowId || '';
    if (!id) {
      return '#MX-0000';
    }
    const token = String(id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `#MX-${token.slice(-4).padStart(4, '0')}`;
  }

  viewAssignedStudents(teacher: RosterDisplayUser) {
    const teacherId = teacher.id || teacher.rosterRowId;
    if (!teacherId) {
      return;
    }

    void this.router.navigate([DASHBOARD_NAV_ROUTES.manageTeacherStudents(teacherId)]);
  }

  private updateDisplayedCount(): void {
    this.displayedCount = this.filterTeachers(this.teachersList, this.searchText).length;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
