import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  LIBRARY_ALLOWED_EXTENSIONS,
  LIBRARY_MAX_FILE_BYTES,
  LIBRARY_MOCK_FILES,
  LIBRARY_MOCK_STATS,
  LIBRARY_MOCK_USAGE,
} from './data/library.mock';
import {
  LibraryFileCategory,
  LibraryFileItem,
  LibraryFilesQuery,
  LibraryFilesResponse,
  LibraryIngestStatus,
  LibraryStats,
  LibraryUploadOptions,
  LibraryUploadResult,
  LibraryUserRole,
  LibraryUserUsage,
  LibraryVisibility,
} from './models/library.models';

/** Logic Service library file row (camelCase + snake_case tolerant). */
type BackendLibraryFile = {
  id?: string;
  description?: string;
  fileURL?: string;
  fileUrl?: string;
  file_url?: string;
  fileName?: string;
  file_name?: string;
  createdBy?: string;
  created_by?: string;
  libraryFiles?: boolean;
  library_files?: boolean;
  organizationId?: string;
  organization_id?: string;
  uploadedBy?: string;
  uploaded_by?: string;
  uploadedByName?: string;
  uploaded_by_name?: string;
  mimeType?: string;
  mime_type?: string;
  sizeBytes?: number;
  size_bytes?: number;
  storageKey?: string;
  storage_key?: string;
  visibility?: LibraryVisibility | string;
  status?: LibraryIngestStatus | string;
  creation_date?: string;
  modification_date?: string;
  created_at?: string;
  updated_at?: string;
  key?: string;
  url?: string;
};

type LibraryListResponse =
  | { success?: boolean; data?: BackendLibraryFile[] }
  | BackendLibraryFile[];

type LibraryUploadResponse = {
  message?: string;
  key?: string;
  url?: string;
  data?: BackendLibraryFile;
};

const DEFAULT_QUOTA_GB = 100;

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly apiUrl = environment.majesticWarhorseApi;

  /** In-memory demo copies (reset when entering demo). */
  private demoFiles: LibraryFileItem[] = [...LIBRARY_MOCK_FILES];
  private demoStats: LibraryStats = { ...LIBRARY_MOCK_STATS };
  private demoUsage: LibraryUserUsage[] = [...LIBRARY_MOCK_USAGE];

  constructor(private http: HttpClient) {}

  resetDemoData(): void {
    this.demoFiles = [...LIBRARY_MOCK_FILES];
    this.demoStats = { ...LIBRARY_MOCK_STATS };
    this.demoUsage = [...LIBRARY_MOCK_USAGE];
  }

  getStats(role: LibraryUserRole, isDemoMode: boolean): Observable<LibraryStats> {
    if (isDemoMode) {
      return of({ ...this.demoStats }).pipe(delay(280));
    }

    return this.fetchLibraryFiles().pipe(
      map((files) => this.computeStats(files)),
      catchError(() => of(this.emptyStats()))
    );
  }

  getUserUsage(role: LibraryUserRole, isDemoMode: boolean): Observable<LibraryUserUsage[]> {
    if (isDemoMode) {
      return of([...this.demoUsage]).pipe(delay(280));
    }
    // Live API does not expose per-user storage breakdown yet.
    return of([]);
  }

  getFiles(
    query: LibraryFilesQuery,
    role: LibraryUserRole,
    currentUserId: string,
    isDemoMode: boolean
  ): Observable<LibraryFilesResponse> {
    if (isDemoMode) {
      return of(null).pipe(
        delay(320),
        map(() => this.filterFiles([...this.demoFiles], query, role, currentUserId))
      );
    }

    return this.fetchLibraryFiles().pipe(
      map((files) => this.filterFiles(files, query, role, currentUserId)),
      catchError(() =>
        of({
          items: [],
          page: Math.max(1, query.page || 1),
          totalPages: 1,
          totalItems: 0,
        })
      )
    );
  }

  uploadFile(
    file: File,
    role: LibraryUserRole,
    userId: string,
    userName: string,
    isDemoMode: boolean,
    options: LibraryUploadOptions = {}
  ): Observable<LibraryUploadResult> {
    const validationError = this.validateFile(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const visibility: LibraryVisibility = options.visibility || 'private';

    if (isDemoMode) {
      const extension = this.extensionOf(file.name);
      const category = this.categoryOf(extension);
      const item: LibraryFileItem = {
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        extension,
        category,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        uploadedById: userId,
        uploadedByName: userName,
        uploadedByRole: role,
        uploadedAt: new Date().toISOString(),
        previewUrl: category === 'image' ? URL.createObjectURL(file) : undefined,
        downloadUrl: URL.createObjectURL(file),
        thumbnailUrl: category === 'image' ? URL.createObjectURL(file) : undefined,
        visibility,
        status: 'processing',
        description: options.description,
      };

      this.demoFiles = [item, ...this.demoFiles];
      this.bumpDemoStats(item.sizeBytes, category, 1);
      return of({ item }).pipe(delay(500));
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket_name', 'library');
    formData.append('library_files', 'true');
    formData.append('visibility', visibility);
    if (options.description?.trim()) {
      formData.append('description', options.description.trim());
    }

    return this.http
      .post<LibraryUploadResponse>(`${this.apiUrl}file/upload`, formData)
      .pipe(
        map((res) => {
          const mapped = res.data
            ? this.mapLibraryFile(res.data)
            : null;
          if (mapped) {
            return { item: mapped };
          }

          // Fallback only when Logic returns key/url without a full `data` object.
          const extension = this.extensionOf(file.name);
          const category = this.categoryOf(extension);
          const url = res.url || '';
          const storageKey = res.key || undefined;
          const item: LibraryFileItem = {
            id: storageKey || `f-${Date.now()}`,
            name: file.name.replace(/\.[^.]+$/, ''),
            extension,
            category,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            uploadedById: userId,
            uploadedByName: userName,
            uploadedAt: new Date().toISOString(),
            previewUrl: category === 'image' ? url : undefined,
            downloadUrl: url,
            thumbnailUrl: category === 'image' ? url : undefined,
            visibility,
            status: 'pending',
            storageKey,
            description: options.description,
          };
          return { item };
        })
      );
  }

  deleteFile(id: string, isDemoMode: boolean): Observable<void> {
    if (isDemoMode) {
      const existing = this.demoFiles.find((f) => f.id === id);
      if (!existing) {
        return throwError(() => new Error('File not found'));
      }
      this.demoFiles = this.demoFiles.filter((f) => f.id !== id);
      this.bumpDemoStats(-existing.sizeBytes, existing.category, -1);
      return of(void 0).pipe(delay(250));
    }

    return this.http
      .delete(`${this.apiUrl}file/library/${encodeURIComponent(id)}`)
      .pipe(map(() => void 0));
  }

  canDelete(file: LibraryFileItem, role: LibraryUserRole, currentUserId: string): boolean {
    if (role === 'organization') {
      return true;
    }
    if (!file.uploadedById || file.uploadedById === 'unknown') {
      return role === 'teacher';
    }
    return file.uploadedById === currentUserId;
  }

  validateFile(file: File): string | null {
    if (file.size > LIBRARY_MAX_FILE_BYTES) {
      return 'File exceeds the 500 MB limit.';
    }
    const ext = this.extensionOf(file.name);
    if (!(LIBRARY_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      return `Unsupported file type .${ext || 'unknown'}.`;
    }
    return null;
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  statusLabel(status?: LibraryIngestStatus): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'ready':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return '—';
    }
  }

  /** True when any file is still waiting on Shared AI ingest (Logic status only — never poll ingest-status). */
  needsIngestPolling(files: LibraryFileItem[]): boolean {
    return files.some((f) => f.status === 'pending' || f.status === 'processing');
  }

  visibilityLabel(visibility?: LibraryVisibility): string {
    switch (visibility) {
      case 'organization':
        return 'Organization';
      case 'teacher':
        return 'Teachers';
      case 'student':
        return 'Students';
      case 'private':
        return 'Private';
      default:
        return '—';
    }
  }

  private fetchLibraryFiles(): Observable<LibraryFileItem[]> {
    return this.http.get<LibraryListResponse>(`${this.apiUrl}file/library`).pipe(
      map((res) => {
        const rows = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];
        return rows
          .map((row) => this.mapLibraryFile(row))
          .filter((f): f is LibraryFileItem => !!f)
          .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
      })
    );
  }

  private mapLibraryFile(row: BackendLibraryFile | null | undefined): LibraryFileItem | null {
    if (!row) {
      return null;
    }

    const id = (row.id || '').toString();
    const storageKey = (row.storageKey || row.storage_key || row.key || '').toString();
    const url = (row.fileURL || row.fileUrl || row.file_url || row.url || '').toString();
    const fileNameRaw =
      (row.fileName || row.file_name || storageKey.split('/').pop() || url.split('/').pop() || '').toString();
    if (!id && !storageKey && !fileNameRaw) {
      return null;
    }

    const fileName = fileNameRaw || 'file';
    const extension = this.extensionOf(fileName);
    const category = this.categoryOf(extension);
    const name = fileName.replace(/\.[^.]+$/, '') || fileName;
    const uploadedAt =
      row.creation_date ||
      row.created_at ||
      row.modification_date ||
      row.updated_at ||
      new Date().toISOString();
    const mimeType = (row.mimeType || row.mime_type || this.mimeOf(extension)).toString();
    const sizeBytes = Number(row.sizeBytes ?? row.size_bytes) || 0;
    const uploadedById = (row.uploadedBy || row.uploaded_by || row.createdBy || row.created_by || 'unknown').toString();
    const visibility = this.normalizeVisibility(row.visibility);
    const status = this.normalizeStatus(row.status);

    return {
      id: id || storageKey || fileName,
      name,
      extension,
      category,
      mimeType,
      sizeBytes,
      uploadedById,
      uploadedByName: (row.uploadedByName || row.uploaded_by_name || 'Library').toString(),
      uploadedAt: new Date(uploadedAt).toISOString(),
      previewUrl: url || undefined,
      downloadUrl: url || undefined,
      thumbnailUrl: category === 'image' ? url || undefined : undefined,
      visibility,
      status,
      storageKey: storageKey || undefined,
      description: row.description || undefined,
    };
  }

  private normalizeVisibility(value?: string): LibraryVisibility | undefined {
    if (!value) {
      return undefined;
    }
    const v = value.toLowerCase();
    if (v === 'organization' || v === 'teacher' || v === 'student' || v === 'private') {
      return v;
    }
    return undefined;
  }

  private normalizeStatus(value?: string): LibraryIngestStatus | undefined {
    if (!value) {
      return undefined;
    }
    const v = value.toLowerCase();
    if (v === 'pending' || v === 'processing' || v === 'ready' || v === 'failed') {
      return v;
    }
    return undefined;
  }

  private filterFiles(
    source: LibraryFileItem[],
    query: LibraryFilesQuery,
    role: LibraryUserRole,
    currentUserId: string
  ): LibraryFilesResponse {
    let items = [...source];

    // Live list is visibility-scoped by Logic. Prefer `visibility` (+ owner id); `uploadedByRole` is demo-only.
    if (role === 'student') {
      items = items.filter(
        (f) =>
          f.uploadedById === currentUserId ||
          f.uploadedById === 'unknown' ||
          f.visibility === 'student' ||
          f.visibility === 'organization'
      );
    } else if (role === 'teacher') {
      items = items.filter(
        (f) =>
          f.uploadedById === currentUserId ||
          f.uploadedById === 'unknown' ||
          f.visibility === 'teacher' ||
          f.visibility === 'organization' ||
          f.visibility === 'student'
      );
    }

    const tab = query.tab || 'all';
    if (tab === 'videos' || query.type === 'video') {
      items = items.filter((f) => f.category === 'video');
    } else if (tab === 'documents' || query.type === 'document') {
      items = items.filter((f) => f.category === 'document');
    } else if (tab === 'images' || query.type === 'image') {
      items = items.filter((f) => f.category === 'image');
    } else if (tab === 'organizations') {
      items = items.filter(
        (f) => f.visibility === 'organization' || f.uploadedByRole === 'organization'
      );
    } else if (tab === 'my') {
      items = items.filter((f) => f.uploadedById === currentUserId);
    } else if (tab === 'teachers') {
      items = items.filter(
        (f) => f.visibility === 'teacher' || f.uploadedByRole === 'teacher'
      );
    } else if (tab === 'students' || tab === 'my-students') {
      items = items.filter(
        (f) => f.visibility === 'student' || f.uploadedByRole === 'student'
      );
    }

    if (query.type && query.type !== 'all') {
      items = items.filter((f) => f.category === query.type);
    }

    if (query.uploadedBy) {
      items = items.filter((f) => f.uploadedById === query.uploadedBy);
    }

    if (query.role && query.role !== 'all') {
      items = items.filter((f) => f.visibility === query.role || f.uploadedByRole === query.role);
    }

    const search = query.search?.trim().toLowerCase();
    if (search) {
      items = items.filter(
        (f) =>
          f.name.toLowerCase().includes(search) ||
          f.uploadedByName.toLowerCase().includes(search) ||
          f.extension.toLowerCase().includes(search) ||
          f.category.toLowerCase().includes(search) ||
          (f.status || '').toLowerCase().includes(search) ||
          (f.visibility || '').toLowerCase().includes(search) ||
          (f.storageKey || '').toLowerCase().includes(search)
      );
    }

    items.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 10);
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit) || 1);
    const start = (page - 1) * limit;

    return {
      items: items.slice(start, start + limit),
      page,
      totalPages,
      totalItems,
    };
  }

  private computeStats(files: LibraryFileItem[]): LibraryStats {
    const stats = this.emptyStats();
    let usedBytes = 0;

    files.forEach((f) => {
      usedBytes += f.sizeBytes || 0;
      const key =
        f.category === 'video'
          ? 'videos'
          : f.category === 'document'
            ? 'documents'
            : f.category === 'image'
              ? 'images'
              : 'others';
      stats[key].count += 1;
      stats[key].sizeGb += f.sizeBytes / (1024 * 1024 * 1024);
    });

    const usedGb = usedBytes / (1024 * 1024 * 1024);
    stats.usedGb = +usedGb.toFixed(1);
    stats.remainingGb = +Math.max(0, stats.quotaGb - usedGb).toFixed(1);
    stats.percentUsed = Math.min(100, +((usedGb / stats.quotaGb) * 100).toFixed(1));
    (['videos', 'documents', 'images', 'others'] as const).forEach((k) => {
      stats[k].sizeGb = +stats[k].sizeGb.toFixed(1);
    });
    return stats;
  }

  private emptyStats(): LibraryStats {
    return {
      quotaGb: DEFAULT_QUOTA_GB,
      usedGb: 0,
      remainingGb: DEFAULT_QUOTA_GB,
      percentUsed: 0,
      videos: { count: 0, sizeGb: 0 },
      documents: { count: 0, sizeGb: 0 },
      images: { count: 0, sizeGb: 0 },
      others: { count: 0, sizeGb: 0 },
    };
  }

  private bumpDemoStats(deltaBytes: number, category: LibraryFileCategory, countDelta: number): void {
    const deltaGb = deltaBytes / (1024 * 1024 * 1024);
    this.demoStats = {
      ...this.demoStats,
      usedGb: Math.max(0, +(this.demoStats.usedGb + deltaGb).toFixed(1)),
      remainingGb: Math.max(0, +(this.demoStats.quotaGb - (this.demoStats.usedGb + deltaGb)).toFixed(1)),
      percentUsed: Math.min(
        100,
        +(((this.demoStats.usedGb + deltaGb) / this.demoStats.quotaGb) * 100).toFixed(1)
      ),
    };

    const key =
      category === 'video'
        ? 'videos'
        : category === 'document'
          ? 'documents'
          : category === 'image'
            ? 'images'
            : 'others';

    this.demoStats = {
      ...this.demoStats,
      [key]: {
        count: Math.max(0, this.demoStats[key].count + countDelta),
        sizeGb: Math.max(0, +(this.demoStats[key].sizeGb + deltaGb).toFixed(1)),
      },
    };
  }

  private extensionOf(name: string): string {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  private categoryOf(ext: string): LibraryFileCategory {
    if (['mp4', 'mov', 'avi'].includes(ext)) {
      return 'video';
    }
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return 'image';
    }
    if (['mp3'].includes(ext)) {
      return 'audio';
    }
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'].includes(ext)) {
      return 'document';
    }
    return 'other';
  }

  private mimeOf(ext: string): string {
    const map: Record<string, string> = {
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      mp3: 'audio/mpeg',
      pdf: 'application/pdf',
      txt: 'text/plain',
    };
    return map[ext] || 'application/octet-stream';
  }
}
