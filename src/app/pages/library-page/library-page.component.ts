import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  interval,
  skip,
  takeUntil,
} from 'rxjs';
import { DemoModeService } from 'src/app/shared/services/demo-mode.service';
import { DASHBOARD_NAV_ROUTES } from '../dashboard/dashboard-routes.config';
import { UserModel } from '../login-page/model/user-model';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { LIBRARY_ALLOWED_EXTENSIONS } from './data/library.mock';
import { LibraryService } from './library.service';
import {
  LibraryFileItem,
  LibraryIngestStatus,
  LibraryStats,
  LibraryTabId,
  LibraryUsageFilter,
  LibraryUserRole,
  LibraryUserUsage,
  LibraryVisibility,
} from './models/library.models';

type LibraryTab = { id: LibraryTabId; label: string };

type UsageFilterOption = { id: LibraryUsageFilter; label: string };

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './library-page.component.html',
  styleUrl: './library-page.component.scss',
})
export class LibraryPageComponent implements OnInit, OnDestroy {
  readonly homeRoute = DASHBOARD_NAV_ROUTES.overview;
  readonly acceptAttr = LIBRARY_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');
  readonly maxSizeLabel = '500 MB';

  role: LibraryUserRole = 'student';
  currentUserId = 'local-user';
  currentUserName = 'You';
  tabs: LibraryTab[] = [];
  activeTab: LibraryTabId = 'all';

  stats: LibraryStats | null = null;
  usageRows: LibraryUserUsage[] = [];
  usageFilter: LibraryUsageFilter = 'all';
  usageFilterOpen = false;
  selectedUsage: LibraryUserUsage | null = null;
  readonly usageFilterOptions: UsageFilterOption[] = [
    { id: 'all', label: 'All' },
    { id: 'teacher', label: 'Teachers' },
    { id: 'student', label: 'Students' },
  ];
  files: LibraryFileItem[] = [];
  selectedIds = new Set<string>();

  search = '';
  page = 1;
  limit = 8;
  totalPages = 1;
  totalItems = 0;

  loadingStats = true;
  loadingFiles = true;
  uploading = false;
  uploadProgress = 0;
  uploadVisibility: LibraryVisibility = 'private';
  readonly visibilityOptions: { id: LibraryVisibility; label: string }[] = [
    { id: 'private', label: 'Private' },
    { id: 'teacher', label: 'Teachers' },
    { id: 'student', label: 'Students' },
    { id: 'organization', label: 'Organization' },
  ];
  dragOver = false;

  previewOpen = false;
  previewFile: LibraryFileItem | null = null;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();
  private ingestPollSub: Subscription | null = null;
  private readonly ingestPollMs = 4000;
  private search$ = new Subject<string>();

  constructor(
    private libraryService: LibraryService,
    private commonService: CommonService,
    private demoModeService: DemoModeService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.resolveUser();
    this.tabs = this.tabsForRole(this.role);
    this.activeTab = this.tabs[0]?.id ?? 'all';

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const tab = params.get('tab') as LibraryTabId | null;
      const search = params.get('search') ?? '';
      const page = Number(params.get('page') || 1);
      if (tab && this.tabs.some((t) => t.id === tab)) {
        this.activeTab = tab;
      }
      this.search = search;
      this.page = Number.isFinite(page) && page > 0 ? page : 1;
      this.loadFiles();
    });

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.patchQuery({ search: value || null, page: 1 });
      });

    this.demoModeService.demoLoading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      if (loading) {
        this.loadingFiles = true;
        this.loadingStats = true;
        this.files = [];
        this.stats = null;
      }
    });

    this.demoModeService.demoMode$.pipe(skip(1), takeUntil(this.destroy$)).subscribe((isDemo) => {
      this.resolveUser();
      if (isDemo) {
        this.libraryService.resetDemoData();
      }
      this.loadStats();
      this.loadFiles();
      if (this.role === 'organization') {
        this.loadUsage();
      }
    });

    this.loadStats();
    if (this.role === 'organization') {
      this.loadUsage();
    }
  }

  get isDemoMode(): boolean {
    return this.demoModeService.isDemoMode;
  }

  get isDemoTransitionLoading(): boolean {
    return this.demoModeService.isDemoLoading;
  }

  get emptyTitle(): string {
    return 'No data';
  }

  get emptyMessage(): string {
    if (this.search.trim()) {
      return 'No files match your search.';
    }
    if (this.activeTab !== (this.tabs[0]?.id ?? 'all')) {
      return 'No files in this filter yet.';
    }
    return this.isDemoMode
      ? 'Upload your first learning resource to get started.'
      : 'No files found from the server for this account.';
  }

  ngOnDestroy(): void {
    this.stopIngestPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get percentRemaining(): number {
    if (!this.stats?.quotaGb) {
      return 0;
    }
    return +((this.stats.remainingGb / this.stats.quotaGb) * 100).toFixed(1);
  }

  get allSelectedOnPage(): boolean {
    return this.files.length > 0 && this.files.every((f) => this.selectedIds.has(f.id));
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get canBulkDelete(): boolean {
    return this.role === 'organization' && this.selectedCount > 0;
  }

  get filteredUsageRows(): LibraryUserUsage[] {
    if (this.usageFilter === 'all') {
      return this.usageRows;
    }
    return this.usageRows.filter((row) => row.userType === this.usageFilter);
  }

  get usageTeacherCount(): number {
    return this.usageRows.filter((row) => row.userType === 'teacher').length;
  }

  get usageStudentCount(): number {
    return this.usageRows.filter((row) => row.userType === 'student').length;
  }

  get usageFilterSummary(): string {
    if (this.selectedUsage) {
      return `${this.selectedUsage.userName} · ${this.selectedUsage.files} files`;
    }
    if (this.usageFilter === 'teacher') {
      return `${this.filteredUsageRows.length} teacher${this.filteredUsageRows.length === 1 ? '' : 's'}`;
    }
    if (this.usageFilter === 'student') {
      return `${this.filteredUsageRows.length} student${this.filteredUsageRows.length === 1 ? '' : 's'}`;
    }
    return `${this.usageRows.length} users · ${this.usageTeacherCount} teachers · ${this.usageStudentCount} students`;
  }

  get usageFilterSelectedLabel(): string {
    if (this.selectedUsage) {
      return `${this.roleLabel(this.selectedUsage.userType)} · ${this.selectedUsage.userName}`;
    }
    if (this.usageFilter === 'teacher') {
      return 'Teachers';
    }
    if (this.usageFilter === 'student') {
      return 'Students';
    }
    return 'All users';
  }

  setTab(tab: LibraryTabId): void {
    this.patchQuery({ tab, page: 1 });
  }

  onSearchInput(value: string): void {
    this.search = value;
    this.search$.next(value);
  }

  clearSearch(): void {
    this.search = '';
    this.patchQuery({ search: null, page: 1 });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.patchQuery({ page });
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.files.forEach((f) => this.selectedIds.add(f.id));
    } else {
      this.files.forEach((f) => this.selectedIds.delete(f.id));
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  toggleSelect(id: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const files = Array.from(event.dataTransfer?.files ?? []);
    void this.uploadFiles(files);
  }

  onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    void this.uploadFiles(files);
  }

  async uploadFiles(files: File[]): Promise<void> {
    if (!files.length) {
      return;
    }
    this.uploading = true;
    this.uploadProgress = 8;

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const error = this.libraryService.validateFile(file);
      if (error) {
        this.toast(error, TOASTER_MESSAGE_TYPE.ERROR);
        continue;
      }
      try {
        await new Promise<void>((resolve, reject) => {
          this.libraryService
            .uploadFile(
              file,
              this.role,
              this.currentUserId,
              this.currentUserName,
              this.isDemoMode,
              { visibility: this.uploadVisibility }
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => resolve(),
              error: (err) => reject(err),
            });
        });
        this.uploadProgress = Math.round(((i + 1) / files.length) * 100);
      } catch (err) {
        this.toast((err as Error)?.message || 'Upload failed', TOASTER_MESSAGE_TYPE.ERROR);
      }
    }

    this.uploading = false;
    this.uploadProgress = 0;
    this.loadStats();
    this.loadFiles();
    if (this.role === 'organization') {
      this.loadUsage();
    }
    this.toast('Upload complete', TOASTER_MESSAGE_TYPE.SUCCESS);
  }

  openPreview(file: LibraryFileItem): void {
    this.previewFile = file;
    this.previewOpen = true;
  }

  closePreview(): void {
    this.previewOpen = false;
    this.previewFile = null;
  }

  downloadFile(file: LibraryFileItem): void {
    if (!file.downloadUrl || file.downloadUrl === '#') {
      this.toast(
        this.isDemoMode
          ? 'Download is not available for this mock file.'
          : 'Download is not available for this file.',
        TOASTER_MESSAGE_TYPE.WARNING
      );
      return;
    }
    window.open(file.downloadUrl, '_blank', 'noopener');
  }

  deleteFile(file: LibraryFileItem): void {
    if (!this.libraryService.canDelete(file, this.role, this.currentUserId)) {
      this.toast('You do not have permission to delete this file.', TOASTER_MESSAGE_TYPE.ERROR);
      return;
    }
    this.libraryService
      .deleteFile(file.id, this.isDemoMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedIds.delete(file.id);
          this.selectedIds = new Set(this.selectedIds);
          if (this.previewFile?.id === file.id) {
            this.closePreview();
          }
          this.toast('File deleted', TOASTER_MESSAGE_TYPE.SUCCESS);
          this.loadStats();
          this.loadFiles();
          if (this.role === 'organization') {
            this.loadUsage();
          }
        },
        error: (err) => this.toast(err?.message || 'Delete failed', TOASTER_MESSAGE_TYPE.ERROR),
      });
  }

  bulkDelete(): void {
    if (!this.canBulkDelete) {
      return;
    }
    const ids = [...this.selectedIds];
    let remaining = ids.length;
    ids.forEach((id) => {
      this.libraryService
        .deleteFile(id, this.isDemoMode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            remaining -= 1;
            if (remaining <= 0) {
              this.selectedIds.clear();
              this.selectedIds = new Set();
              this.toast('Selected files deleted', TOASTER_MESSAGE_TYPE.SUCCESS);
              this.loadStats();
              this.loadFiles();
              this.loadUsage();
            }
          },
          error: (err) => this.toast(err?.message || 'Bulk delete failed', TOASTER_MESSAGE_TYPE.ERROR),
        });
    });
  }

  canDelete(file: LibraryFileItem): boolean {
    return this.libraryService.canDelete(file, this.role, this.currentUserId);
  }

  formatBytes(bytes: number): string {
    return this.libraryService.formatBytes(bytes);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    return d.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  fileIcon(file: LibraryFileItem): string {
    switch (file.category) {
      case 'video':
        return 'movie';
      case 'image':
        return 'image';
      case 'audio':
        return 'graphic_eq';
      case 'document':
        return file.extension === 'pdf' ? 'picture_as_pdf' : 'description';
      default:
        return 'draft';
    }
  }

  previewKind(file: LibraryFileItem | null): 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'fallback' {
    if (!file) {
      return 'fallback';
    }
    if (file.extension === 'pdf') {
      return 'pdf';
    }
    if (file.category === 'image') {
      return 'image';
    }
    if (file.category === 'video') {
      return 'video';
    }
    if (file.category === 'audio') {
      return 'audio';
    }
    if (file.extension === 'txt') {
      return 'text';
    }
    return 'fallback';
  }

  safePreviewUrl(file: LibraryFileItem | null): SafeResourceUrl | null {
    if (!file?.previewUrl) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(file.previewUrl);
  }

  roleLabel(role: string): string {
    return this.commonService.transformText(role);
  }

  visibilityLabel(visibility?: LibraryVisibility): string {
    return this.libraryService.visibilityLabel(visibility);
  }

  statusLabel(status?: LibraryIngestStatus): string {
    return this.libraryService.statusLabel(status);
  }

  toggleUsageFilterPopup(): void {
    this.usageFilterOpen = !this.usageFilterOpen;
  }

  closeUsageFilterPopup(): void {
    this.usageFilterOpen = false;
  }

  setUsageFilter(filter: LibraryUsageFilter): void {
    this.usageFilter = filter;
    this.selectedUsage = null;
    if (filter === 'all') {
      this.usageFilterOpen = false;
    } else {
      this.usageFilterOpen = true;
    }
    const hadUploadedBy = !!this.route.snapshot.queryParamMap.get('uploadedBy');
    this.patchQuery({ uploadedBy: null, page: 1 });
    if (!hadUploadedBy) {
      this.loadFiles();
    }
  }

  clearUsageFilter(): void {
    this.usageFilter = 'all';
    this.selectedUsage = null;
    this.usageFilterOpen = false;
    const hadUploadedBy = !!this.route.snapshot.queryParamMap.get('uploadedBy');
    this.patchQuery({ uploadedBy: null, page: 1 });
    if (!hadUploadedBy) {
      this.loadFiles();
    }
  }

  applyUsageUserFilter(row: LibraryUserUsage): void {
    this.usageFilter = row.userType;
    this.selectedUsage = row;
    this.usageFilterOpen = false;
    this.patchQuery({ uploadedBy: row.userId, page: 1, tab: 'all' });
  }

  filterByUser(userId: string): void {
    const row = this.usageRows.find((item) => item.userId === userId) ?? null;
    if (row) {
      this.applyUsageUserFilter(row);
      return;
    }
    this.selectedUsage = null;
    this.patchQuery({ uploadedBy: userId, page: 1, tab: 'all' });
  }

  private resolveUser(): void {
    const info: UserModel = this.commonService.loginedUserInfo ?? ({} as UserModel);
    const role = (info.role || sessionStorage.getItem('loginType') || 'student') as LibraryUserRole;
    this.role = ['organization', 'teacher', 'student'].includes(role) ? role : 'student';
    this.currentUserId = String(info.id || `${this.role}-local`);
    if (this.role === 'organization') {
      this.currentUserName = info.name?.trim() || 'Organization';
    } else {
      const first = (info.firstName || info.first_name || '').trim();
      const last = (info.lastName || info.last_name || '').trim();
      this.currentUserName = [first, last].filter(Boolean).join(' ') || 'You';
    }

    // Stable mock ids so role filters match seed data in demo mode only.
    if (this.isDemoMode) {
      if (this.role === 'teacher') {
        this.currentUserId = 't-1';
        this.currentUserName = this.currentUserName || 'John Smith';
      } else if (this.role === 'student') {
        this.currentUserId = 's-1';
        this.currentUserName = this.currentUserName || 'Alice Doe';
      } else {
        this.currentUserId = 'org-1';
      }
    }
  }

  private tabsForRole(role: LibraryUserRole): LibraryTab[] {
    if (role === 'organization') {
      return [
        { id: 'all', label: 'All Files' },
        { id: 'organizations', label: 'Organizations' },
        { id: 'teachers', label: 'Teachers' },
        { id: 'students', label: 'Students' },
        { id: 'videos', label: 'Videos' },
        { id: 'documents', label: 'Documents' },
        { id: 'images', label: 'Images' },
      ];
    }
    if (role === 'teacher') {
      return [
        { id: 'my', label: 'My Library' },
        { id: 'my-students', label: 'My Students' },
        { id: 'videos', label: 'Videos' },
        { id: 'documents', label: 'Documents' },
        { id: 'images', label: 'Images' },
      ];
    }
    return [
      { id: 'my', label: 'My Files' },
      { id: 'videos', label: 'Videos' },
      { id: 'documents', label: 'Documents' },
      { id: 'images', label: 'Images' },
    ];
  }

  private loadStats(): void {
    this.loadingStats = true;
    this.libraryService
      .getStats(this.role, this.isDemoMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.loadingStats = false;
        },
        error: () => {
          this.loadingStats = false;
          this.toast('Could not load storage stats', TOASTER_MESSAGE_TYPE.ERROR);
        },
      });
  }

  private loadUsage(): void {
    this.libraryService
      .getUserUsage(this.role, this.isDemoMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.usageRows = rows;
          if (this.selectedUsage) {
            this.selectedUsage = rows.find((row) => row.userId === this.selectedUsage?.userId) ?? null;
          }
        },
      });
  }

  private loadFiles(options: { silent?: boolean } = {}): void {
    const silent = !!options.silent;
    if (!silent) {
      this.loadingFiles = true;
    }
    const uploadedBy = this.route.snapshot.queryParamMap.get('uploadedBy') || undefined;
    if (uploadedBy && !this.selectedUsage) {
      this.selectedUsage = this.usageRows.find((row) => row.userId === uploadedBy) ?? null;
      if (this.selectedUsage) {
        this.usageFilter = this.selectedUsage.userType;
      }
    }
    this.libraryService
      .getFiles(
        {
          page: this.page,
          limit: this.limit,
          search: this.search,
          tab: this.activeTab,
          uploadedBy,
          role:
            !uploadedBy && this.usageFilter !== 'all'
              ? this.usageFilter
              : undefined,
        },
        this.role,
        this.currentUserId,
        this.isDemoMode
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.files = res.items;
          this.page = res.page;
          this.totalPages = res.totalPages;
          this.totalItems = res.totalItems;
          this.loadingFiles = false;
          this.syncIngestPolling();
        },
        error: () => {
          this.loadingFiles = false;
          if (!silent) {
            this.toast('Could not load files', TOASTER_MESSAGE_TYPE.ERROR);
          }
        },
      });
  }

  /** Refresh via GET /file/library while ingest is pending/processing — never call /file/ingest-status. */
  private syncIngestPolling(): void {
    const needsPoll =
      !this.isDemoMode && this.libraryService.needsIngestPolling(this.files);
    if (!needsPoll) {
      this.stopIngestPolling();
      return;
    }
    if (this.ingestPollSub && !this.ingestPollSub.closed) {
      return;
    }
    this.ingestPollSub = interval(this.ingestPollMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadFiles({ silent: true }));
  }

  private stopIngestPolling(): void {
    this.ingestPollSub?.unsubscribe();
    this.ingestPollSub = null;
  }

  private patchQuery(patch: Record<string, string | number | null>): void {
    const next: Record<string, string | null> = {
      tab: this.activeTab,
      search: this.search || null,
      page: String(this.page),
      uploadedBy: this.route.snapshot.queryParamMap.get('uploadedBy'),
    };
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === '' || value === undefined) {
        next[key] = null;
      } else {
        next[key] = String(value);
      }
    });
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: next,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private toast(message: string, messageType: string): void {
    this.commonService.openToaster({ message, messageType });
  }
}
