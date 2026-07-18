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
import { Subject, firstValueFrom, switchMap, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { DASHBOARD_NAV_ROUTES } from 'src/app/pages/dashboard/dashboard-routes.config';

@Component({
  selector: 'app-view-assigned-students',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './view-assigned-students.component.html',
  styleUrl: './view-assigned-students.component.scss',
})
export class ViewAssignedStudentsComponent implements OnInit, OnDestroy {
  studentsList: RosterDisplayUser[] = [];
  selectedStudents: string[] = [];
  initiallyAssignedStudentIds: string[] = [];
  contextUser: RosterDisplayUser | null = null;
  private destroy$ = new Subject<void>();
  isLoading = true;
  rosterFilter = '';
  subscriptionTab: 'subscribed' | 'unsubscribed' | null = null;
  showSubscriptionFilterPopup = false;

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
    void this.router.navigate([DASHBOARD_NAV_ROUTES.teachers]);
  }

  setSubscriptionTab(tab: 'subscribed' | 'unsubscribed' | null): void {
    this.subscriptionTab = tab;
    this.showSubscriptionFilterPopup = false;
  }

  toggleSubscriptionFilterPopup(): void {
    this.showSubscriptionFilterPopup = !this.showSubscriptionFilterPopup;
  }

  closeSubscriptionFilterPopup(): void {
    this.showSubscriptionFilterPopup = false;
  }

  getSubscriptionFilterLabel(): string {
    if (this.subscriptionTab === 'subscribed') {
      return 'Subscribed';
    }
    if (this.subscriptionTab === 'unsubscribed') {
      return 'Unsubscribed';
    }
    return 'Filter';
  }

  getSubscriptionFilterMetaLabel(): string {
    if (this.subscriptionTab === 'subscribed') {
      return 'Subscribed';
    }
    if (this.subscriptionTab === 'unsubscribed') {
      return 'Unsubscribed';
    }
    return 'Active';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.enrollment-page__filter-wrap')) {
      this.showSubscriptionFilterPopup = false;
    }
  }

  get subscribedCount(): number {
    return this.studentsList.filter((student) => this.isAssigned(student)).length;
  }

  get unsubscribedCount(): number {
    return this.studentsList.filter((student) => !this.isAssigned(student)).length;
  }

  get displayedCount(): number {
    return this.filteredStudentsList.length;
  }

  selectAllVisible(): void {
    const visibleIds = this.filteredStudentsList
      .map((student) => this.getStudentId(student))
      .filter((id) => !!id);
    this.selectedStudents = [...new Set([...this.selectedStudents, ...visibleIds])];
  }

  clearVisibleSelection(): void {
    const visibleIds = new Set(
      this.filteredStudentsList.map((student) => this.getStudentId(student)).filter((id) => !!id)
    );
    this.selectedStudents = this.selectedStudents.filter((id) => !visibleIds.has(id));
  }

  private async loadEnrollmentData(teacherId: string | null): Promise<void> {
    const orgId = sessionStorage.getItem('organization_id') || '';

    if (!orgId || !teacherId) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.studentsList = [];
    this.selectedStudents = [];
    this.initiallyAssignedStudentIds = [];
    this.contextUser = null;
    this.subscriptionTab = null;
    this.rosterFilter = '';
    this.cdr.detectChanges();

    try {
      const assignedPromise = firstValueFrom(
        this.assignTeacherService.getAssignedStudents(teacherId, orgId).pipe(catchError(() => of(null)))
      );

      const [teachersList, studentsList, assignedResult] = await Promise.all([
        this.rosterDisplay.loadTeachers(orgId, 'active'),
        this.rosterDisplay.loadStudents(orgId, 'active'),
        assignedPromise,
      ]);

      this.contextUser =
        teachersList.find((teacher) => (teacher.id || teacher.rosterRowId) === teacherId) ?? null;
      this.studentsList = studentsList;

      if (assignedResult) {
        this.applyAssignedStudentIds(assignedResult);
      }
    } catch {
      this.studentsList = [];
      this.commonService.openToaster({
        message: 'Error loading enrollment roster',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private applyAssignedStudentIds(result: unknown): void {
    const responseData = (result as { data?: unknown })?.data ?? result;
    let studentIds: string[] = [];

    if (Array.isArray(responseData)) {
      studentIds = responseData
        .map((item) => {
          if (typeof item === 'string') {
            return item.trim();
          }

          if (item && typeof item === 'object') {
            const record = item as Record<string, unknown>;
            return String(record['student_id'] || record['user_id'] || record['id'] || '').trim();
          }

          return '';
        })
        .filter((id) => !!id);
    } else if (
      responseData &&
      typeof responseData === 'object' &&
      Array.isArray((responseData as { student_ids?: string[] }).student_ids)
    ) {
      studentIds = (responseData as { student_ids: string[] }).student_ids.filter((id) => !!id);
    }

    this.selectedStudents = [...studentIds];
    this.initiallyAssignedStudentIds = [...studentIds];
  }

  get activeRosterStudents(): RosterDisplayUser[] {
    return this.selectedStudents
      .map((id) => this.studentsList.find((student) => this.getStudentId(student) === id))
      .filter((student): student is RosterDisplayUser => !!student);
  }

  get filteredStudentsList(): RosterDisplayUser[] {
    let list = this.studentsList;

    if (this.subscriptionTab === 'subscribed') {
      list = list.filter((student) => this.isAssigned(student));
    } else if (this.subscriptionTab === 'unsubscribed') {
      list = list.filter((student) => !this.isAssigned(student));
    }

    const term = this.rosterFilter.trim().toLowerCase();
    if (!term) {
      return list;
    }

    return list.filter((student) => {
      const fullName = this.getStudentName(student).toLowerCase();
      const email = this.getStudentEmail(student).toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }

  getTeacherName(): string {
    const teacher = this.contextUser;
    if (!teacher) {
      return 'Unknown Instructor';
    }

    const first = teacher.firstName || teacher.first_name || '';
    const last = teacher.lastName || teacher.last_name || '';
    const fullName = `${first} ${last}`.trim();
    return fullName || teacher.name?.trim() || 'Unknown Instructor';
  }

  getTeacherEmail(): string {
    const teacher = this.contextUser;
    return teacher?.contact?.email || teacher?.email || '';
  }

  getTeacherAvatarUrl(): string {
    const teacher = this.contextUser;
    const raw = this.commonService.decodeUrl((teacher?.profileImage || teacher?.profile_image) ?? '') as string;
    if (raw?.trim()) {
      return raw;
    }

    const label = this.getTeacherName();
    const email = this.getTeacherEmail();
    const name = label !== 'Unknown Instructor' ? label : email || 'Instructor';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b2c&color=fff&size=128`;
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

  getStudentAvatarUrl(student: RosterDisplayUser): string {
    const raw = this.commonService.decodeUrl((student.profileImage || student.profile_image) ?? '') as string;
    if (raw?.trim()) {
      return raw;
    }

    const label = this.getStudentName(student);
    const email = this.getStudentEmail(student);
    const name = label !== 'Student' ? label : email || 'Student';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b2c&color=fff&size=128`;
  }

  onStudentAvatarError(event: Event, student: RosterDisplayUser): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) {
      return;
    }

    const fallback = this.getStudentAvatarUrl(student);
    if (img.src !== fallback) {
      img.src = fallback;
    }
  }

  getStudentNodeId(student: RosterDisplayUser): string {
    const id = student.id || student.rosterRowId || '';
    if (!id) {
      return '#MX-0000';
    }

    const token = String(id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `#MX-${token.slice(-4).padStart(4, '0')}`;
  }

  toggleStudentSelection(student: RosterDisplayUser, event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('input[type="checkbox"]')) {
      return;
    }

    const studentId = this.getStudentId(student);
    const isCurrentlySelected = this.selectedStudents.includes(studentId);

    if (isCurrentlySelected) {
      this.selectedStudents = this.selectedStudents.filter((id) => id !== studentId);
    } else {
      this.selectedStudents = [...this.selectedStudents, studentId];
    }
  }

  removeFromRoster(student: RosterDisplayUser): void {
    const studentId = this.getStudentId(student);
    this.selectedStudents = this.selectedStudents.filter((id) => id !== studentId);
  }

  getStudentId(student: RosterDisplayUser): string {
    return student.id || '';
  }

  isAssigned(student: RosterDisplayUser): boolean {
    return this.selectedStudents.includes(this.getStudentId(student));
  }

  wasInitiallyAssigned(student: RosterDisplayUser): boolean {
    return (
      this.initiallyAssignedStudentIds.includes(this.getStudentId(student)) &&
      this.selectedStudents.includes(this.getStudentId(student))
    );
  }

  isUnassigning(student: RosterDisplayUser): boolean {
    const id = this.getStudentId(student);
    return (
      this.initiallyAssignedStudentIds.includes(id) &&
      !this.selectedStudents.includes(id)
    );
  }

  hasPendingChanges(): boolean {
    const hasUnassigns = this.initiallyAssignedStudentIds.some(
      (id) => !this.selectedStudents.includes(id)
    );
    const hasNewAssigns = this.selectedStudents.some(
      (id) => !this.initiallyAssignedStudentIds.includes(id)
    );
    return hasUnassigns || hasNewAssigns;
  }

  onStudentSelect(student: RosterDisplayUser, event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;
    const studentId = this.getStudentId(student);
    if (isChecked) {
      if (!this.selectedStudents.includes(studentId)) {
        this.selectedStudents.push(studentId);
      }
    } else {
      const index = this.selectedStudents.indexOf(studentId);
      if (index > -1) {
        this.selectedStudents.splice(index, 1);
      }
    }
  }

  handleStudentUpdate() {
    const teacherId = this.contextUser?.id;
    if (!teacherId) {
      return;
    }
    const unassignStudentIds = this.initiallyAssignedStudentIds.filter(
      (id) => !this.selectedStudents.includes(id)
    );

    const assignPayload = [
      {
        teacher_id: teacherId,
        student_ids: this.selectedStudents,
        ...(unassignStudentIds.length > 0 && {
          unassign_student_ids: unassignStudentIds,
        }),
      },
    ];

    const update$ =
      unassignStudentIds.length > 0
        ? this.assignTeacherService
            .unassignStudentsFromTeacher({
              teacher_id: teacherId,
              unassign_student_ids: unassignStudentIds,
            })
            .pipe(
              switchMap(() =>
                this.assignTeacherService.assignStudentsToTeacher(assignPayload)
              )
            )
        : this.assignTeacherService.assignStudentsToTeacher(assignPayload);

    update$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        if (result.success) {
          this.commonService.openToaster({
            message: 'Students updated successfully!',
            messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
          });
          this.initiallyAssignedStudentIds = [...this.selectedStudents];
          void this.router.navigate([DASHBOARD_NAV_ROUTES.teachers]);
        } else {
          this.commonService.openToaster({
            message: 'Error while updating students, please contact your organization',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        }
      },
      error: () => {
        this.commonService.openToaster({
          message: 'Error while updating students, please contact your organization',
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
