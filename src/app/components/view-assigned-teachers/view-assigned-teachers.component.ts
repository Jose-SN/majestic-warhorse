import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from 'src/app/shared/services/common.service';
import { AssignTeacherService } from '../assign-teachers/assign-teacher.service';
import { RosterDisplayService, RosterDisplayUser } from 'src/app/services/api-service/roster-display.service';
import { Subject, firstValueFrom, of, switchMap, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { DASHBOARD_NAV_ROUTES } from 'src/app/pages/dashboard/dashboard-routes.config';

@Component({
  selector: 'app-view-assigned-teachers',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './view-assigned-teachers.component.html',
  styleUrl: './view-assigned-teachers.component.scss',
})
export class ViewAssignedTeachersComponent implements OnInit, OnDestroy {
  teachersList: RosterDisplayUser[] = [];
  selectedTeachers: string[] = [];
  initiallyAssignedTeacherIds: string[] = [];
  contextUser: RosterDisplayUser | null = null;
  private destroy$ = new Subject<void>();
  isLoading = true;
  rosterFilter = '';
  assignmentTab: 'assigned' | 'unassigned' | null = null;
  showAssignmentFilterPopup = false;

  constructor(
    public commonService: CommonService,
    private assignTeacherService: AssignTeacherService,
    private rosterDisplay: RosterDisplayService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      void this.loadEnrollmentData(params.get('id'));
    });
  }

  navigateBack(): void {
    void this.router.navigate([DASHBOARD_NAV_ROUTES.students]);
  }

  setAssignmentTab(tab: 'assigned' | 'unassigned' | null): void {
    this.assignmentTab = tab;
    this.showAssignmentFilterPopup = false;
  }

  toggleAssignmentFilterPopup(): void {
    this.showAssignmentFilterPopup = !this.showAssignmentFilterPopup;
  }

  closeAssignmentFilterPopup(): void {
    this.showAssignmentFilterPopup = false;
  }

  getAssignmentFilterLabel(): string {
    if (this.assignmentTab === 'assigned') {
      return 'Assigned';
    }
    if (this.assignmentTab === 'unassigned') {
      return 'Unassigned';
    }
    return 'Filter';
  }

  getAssignmentFilterMetaLabel(): string {
    if (this.assignmentTab === 'assigned') {
      return 'Assigned';
    }
    if (this.assignmentTab === 'unassigned') {
      return 'Unassigned';
    }
    return 'Active';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.enrollment-page__filter-wrap')) {
      this.showAssignmentFilterPopup = false;
    }
  }

  get assignedCount(): number {
    return this.teachersList.filter((teacher) => this.isAssigned(teacher)).length;
  }

  get unassignedCount(): number {
    return this.teachersList.filter((teacher) => !this.isAssigned(teacher)).length;
  }

  get displayedCount(): number {
    return this.filteredTeachersList.length;
  }

  selectAllVisible(): void {
    const visibleIds = this.filteredTeachersList
      .map((teacher) => this.getTeacherId(teacher))
      .filter((id) => !!id);
    this.selectedTeachers = [...new Set([...this.selectedTeachers, ...visibleIds])];
  }

  clearVisibleSelection(): void {
    const visibleIds = new Set(
      this.filteredTeachersList.map((teacher) => this.getTeacherId(teacher)).filter((id) => !!id)
    );
    this.selectedTeachers = this.selectedTeachers.filter((id) => !visibleIds.has(id));
  }

  private async loadEnrollmentData(studentId: string | null): Promise<void> {
    const orgId = sessionStorage.getItem('organization_id') || '';

    if (!orgId || !studentId) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.teachersList = [];
    this.selectedTeachers = [];
    this.initiallyAssignedTeacherIds = [];
    this.contextUser = null;
    this.assignmentTab = null;
    this.rosterFilter = '';
    this.cdr.detectChanges();

    try {
      const assignedPromise = firstValueFrom(
        this.assignTeacherService.getAssignedTeachers(studentId, orgId).pipe(catchError(() => of(null)))
      );

      const [studentsList, teachersList, assignedResult] = await Promise.all([
        this.rosterDisplay.loadStudents(orgId, 'active'),
        this.rosterDisplay.loadTeachers(orgId, 'active'),
        assignedPromise,
      ]);

      this.contextUser =
        studentsList.find((student) => (student.id || student.rosterRowId) === studentId) ?? null;
      this.teachersList = teachersList;

      if (assignedResult) {
        this.applyAssignedTeacherIds(assignedResult);
      }
    } catch {
      this.teachersList = [];
      this.commonService.openToaster({
        message: 'Error loading enrollment roster',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private applyAssignedTeacherIds(result: unknown): void {
    const responseData = (result as { data?: unknown })?.data ?? result;
    let teacherIds: string[] = [];

    if (Array.isArray(responseData)) {
      teacherIds = responseData
        .map((item) => {
          if (typeof item === 'string') {
            return item.trim();
          }

          if (item && typeof item === 'object') {
            const record = item as Record<string, unknown>;
            return String(record['teacher_id'] || record['user_id'] || record['id'] || '').trim();
          }

          return '';
        })
        .filter((id) => !!id);
    } else if (
      responseData &&
      typeof responseData === 'object' &&
      Array.isArray((responseData as { teacher_ids?: string[] }).teacher_ids)
    ) {
      teacherIds = (responseData as { teacher_ids: string[] }).teacher_ids.filter((id) => !!id);
    }

    this.selectedTeachers = [...teacherIds];
    this.initiallyAssignedTeacherIds = [...teacherIds];
  }

  get activeRosterTeachers(): RosterDisplayUser[] {
    return this.selectedTeachers
      .map((id) => this.teachersList.find((teacher) => this.getTeacherId(teacher) === id))
      .filter((teacher): teacher is RosterDisplayUser => !!teacher);
  }

  get filteredTeachersList(): RosterDisplayUser[] {
    let list = this.teachersList;

    if (this.assignmentTab === 'assigned') {
      list = list.filter((teacher) => this.isAssigned(teacher));
    } else if (this.assignmentTab === 'unassigned') {
      list = list.filter((teacher) => !this.isAssigned(teacher));
    }

    const term = this.rosterFilter.trim().toLowerCase();
    if (!term) {
      return list;
    }

    return list.filter((teacher) => {
      const fullName = this.getTeacherName(teacher).toLowerCase();
      const email = this.getTeacherEmail(teacher).toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }

  getStudentName(): string {
    const student = this.contextUser;
    if (!student) {
      return 'Unknown Student';
    }

    const first = student.firstName || student.first_name || '';
    const last = student.lastName || student.last_name || '';
    const fullName = `${first} ${last}`.trim();
    return fullName || student.name?.trim() || 'Unknown Student';
  }

  getStudentEmail(): string {
    const student = this.contextUser;
    return student?.contact?.email || student?.email || '';
  }

  getStudentAvatarUrl(): string {
    const student = this.contextUser;
    const raw = this.commonService.decodeUrl((student?.profileImage || student?.profile_image) ?? '') as string;
    if (raw?.trim()) {
      return raw;
    }

    const label = this.getStudentName();
    const email = this.getStudentEmail();
    const name = label !== 'Unknown Student' ? label : email || 'Student';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b2c&color=fff&size=128`;
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

  getTeacherNodeId(teacher: RosterDisplayUser): string {
    const id = teacher.id || teacher.rosterRowId || '';
    if (!id) {
      return '#MX-0000';
    }

    const token = String(id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `#MX-${token.slice(-4).padStart(4, '0')}`;
  }

  getTeacherAvatarUrl(teacher: RosterDisplayUser): string {
    const raw = this.commonService.decodeUrl((teacher.profileImage || teacher.profile_image) ?? '') as string;
    if (raw?.trim()) {
      return raw;
    }

    const label = this.getTeacherName(teacher);
    const email = this.getTeacherEmail(teacher);
    const name = label !== 'Instructor' ? label : email || 'Instructor';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b2c&color=fff&size=128`;
  }

  onTeacherAvatarError(event: Event, teacher: RosterDisplayUser): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) {
      return;
    }

    const fallback = this.getTeacherAvatarUrl(teacher);
    if (img.src !== fallback) {
      img.src = fallback;
    }
  }

  toggleTeacherSelection(teacher: RosterDisplayUser, event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('input[type="checkbox"]')) {
      return;
    }

    const teacherId = this.getTeacherId(teacher);
    const isCurrentlySelected = this.selectedTeachers.includes(teacherId);

    if (isCurrentlySelected) {
      this.selectedTeachers = this.selectedTeachers.filter((id) => id !== teacherId);
    } else {
      this.selectedTeachers = [...this.selectedTeachers, teacherId];
    }
  }

  removeFromRoster(teacher: RosterDisplayUser): void {
    const teacherId = this.getTeacherId(teacher);
    this.selectedTeachers = this.selectedTeachers.filter((id) => id !== teacherId);
  }

  getTeacherId(teacher: RosterDisplayUser): string {
    return teacher.id || '';
  }

  isAssigned(teacher: RosterDisplayUser): boolean {
    return this.selectedTeachers.includes(this.getTeacherId(teacher));
  }

  wasInitiallyAssigned(teacher: RosterDisplayUser): boolean {
    return (
      this.initiallyAssignedTeacherIds.includes(this.getTeacherId(teacher)) &&
      this.selectedTeachers.includes(this.getTeacherId(teacher))
    );
  }

  isUnassigning(teacher: RosterDisplayUser): boolean {
    const id = this.getTeacherId(teacher);
    return this.initiallyAssignedTeacherIds.includes(id) && !this.selectedTeachers.includes(id);
  }

  hasPendingChanges(): boolean {
    const hasUnassigns = this.initiallyAssignedTeacherIds.some(
      (id) => !this.selectedTeachers.includes(id)
    );
    const hasNewAssigns = this.selectedTeachers.some(
      (id) => !this.initiallyAssignedTeacherIds.includes(id)
    );
    return hasUnassigns || hasNewAssigns;
  }

  onTeacherSelect(teacher: RosterDisplayUser, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;
    const teacherId = this.getTeacherId(teacher);

    if (isChecked) {
      if (!this.selectedTeachers.includes(teacherId)) {
        this.selectedTeachers.push(teacherId);
      }
    } else {
      const index = this.selectedTeachers.indexOf(teacherId);
      if (index > -1) {
        this.selectedTeachers.splice(index, 1);
      }
    }
  }

  handleTeacherUpdate(): void {
    const studentId = this.contextUser?.id;
    if (!studentId) {
      return;
    }
    const unassignTeacherIds = this.initiallyAssignedTeacherIds.filter(
      (id) => !this.selectedTeachers.includes(id)
    );

    const assignPayload = [
      {
        student_id: studentId,
        teacher_ids: this.selectedTeachers,
        ...(unassignTeacherIds.length > 0 && {
          unassign_teacher_ids: unassignTeacherIds,
        }),
      },
    ];

    const update$ =
      unassignTeacherIds.length > 0
        ? this.assignTeacherService
            .unassignTeachersFromStudent({
              student_id: studentId,
              unassign_teacher_ids: unassignTeacherIds,
            })
            .pipe(
              switchMap(() =>
                this.assignTeacherService.assignTeachersToStudent(assignPayload)
              )
            )
        : this.assignTeacherService.assignTeachersToStudent(assignPayload);

    update$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        if (result.success) {
          this.commonService.openToaster({
            message: 'Teachers updated successfully!',
            messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
          });
          this.initiallyAssignedTeacherIds = [...this.selectedTeachers];
          void this.router.navigate([DASHBOARD_NAV_ROUTES.students]);
        } else {
          this.commonService.openToaster({
            message: 'Error while updating teachers, please contact your organization',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        }
      },
      error: () => {
        this.commonService.openToaster({
          message: 'Error while updating teachers, please contact your organization',
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
