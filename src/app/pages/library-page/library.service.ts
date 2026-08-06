import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, switchMap } from 'rxjs/operators';
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
  LibraryStats,
  LibraryUploadResult,
  LibraryUserRole,
  LibraryUserUsage,
} from './models/library.models';

type BackendStorageFile = {
  key?: string;
  objectKey?: string;
  lastModified?: string | Date;
  size?: number;
  url?: string;
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

    return this.fetchBackendFiles().pipe(
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

    return this.fetchBackendFiles().pipe(
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
    isDemoMode: boolean
  ): Observable<LibraryUploadResult> {
    const validationError = this.validateFile(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

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
      };

      this.demoFiles = [item, ...this.demoFiles];
      this.bumpDemoStats(item.sizeBytes, category, 1);
      return of({ item }).pipe(delay(500));
    }

    const formData = new FormData();
    formData.append('bucket_name', 'library');
    formData.append('file', file);

    return this.http
      .post<{ message?: string; key?: string; url?: string }>(`${this.apiUrl}file/upload`, formData)
      .pipe(
        map((res) => {
          const extension = this.extensionOf(file.name);
          const category = this.categoryOf(extension);
          const url = res.url || '';
          const item: LibraryFileItem = {
            id: res.key || `f-${Date.now()}`,
            name: file.name.replace(/\.[^.]+$/, ''),
            extension,
            category,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            uploadedById: userId,
            uploadedByName: userName,
            uploadedByRole: role,
            uploadedAt: new Date().toISOString(),
            previewUrl: category === 'image' ? url : undefined,
            downloadUrl: url,
            thumbnailUrl: category === 'image' ? url : undefined,
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

    const params = new HttpParams().set('key', id);
    return this.http
      .delete(`${this.apiUrl}file/delete/${encodeURIComponent(id.split('/').pop() || id)}`, {
        params,
      })
      .pipe(map(() => void 0));
  }

  canDelete(file: LibraryFileItem, role: LibraryUserRole, currentUserId: string): boolean {
    if (role === 'organization') {
      return true;
    }
    // Live R2 objects often lack uploader metadata — teachers can manage those; students only own files.
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

  private fetchBackendFiles(): Observable<LibraryFileItem[]> {
    const params = new HttpParams().set('bucket_name', 'library');
    return this.http.get<BackendStorageFile[] | null>(`${this.apiUrl}file/get`, { params }).pipe(
      switchMap((libraryFiles) => {
        const libraryMapped = this.mapBackendFiles(libraryFiles);
        // Also include default uploads folder so older uploads still appear.
        return this.http.get<BackendStorageFile[] | null>(`${this.apiUrl}file/get`).pipe(
          map((uploadFiles) => {
            const uploadsMapped = this.mapBackendFiles(uploadFiles);
            const byId = new Map<string, LibraryFileItem>();
            [...libraryMapped, ...uploadsMapped].forEach((f) => byId.set(f.id, f));
            return [...byId.values()].sort(
              (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)
            );
          }),
          catchError(() => of(libraryMapped))
        );
      }),
      catchError(() =>
        this.http.get<BackendStorageFile[] | null>(`${this.apiUrl}file/get`).pipe(
          map((files) => this.mapBackendFiles(files)),
          catchError(() => of([]))
        )
      )
    );
  }

  private mapBackendFiles(raw: BackendStorageFile[] | null | undefined): LibraryFileItem[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw
      .filter((row) => !!(row.key || row.objectKey || row.url))
      .filter((row) => {
        const key = row.key || row.objectKey || '';
        // Skip folder placeholders
        return !key.endsWith('/');
      })
      .map((row) => {
        const key = (row.key || row.objectKey || row.url || '').toString();
        const fileName = key.split('/').pop() || key;
        const extension = this.extensionOf(fileName);
        const category = this.categoryOf(extension);
        const name = fileName.replace(/\.[^.]+$/, '') || fileName;
        const url = row.url || '';
        const uploadedAt = row.lastModified
          ? new Date(row.lastModified).toISOString()
          : new Date().toISOString();

        return {
          id: key,
          name,
          extension,
          category,
          mimeType: this.mimeOf(extension),
          sizeBytes: Number(row.size) || 0,
          uploadedById: 'unknown',
          uploadedByName: 'Storage',
          uploadedByRole: 'organization' as LibraryUserRole,
          uploadedAt,
          previewUrl: url || undefined,
          downloadUrl: url || undefined,
          thumbnailUrl: category === 'image' ? url || undefined : undefined,
        };
      });
  }

  private filterFiles(
    source: LibraryFileItem[],
    query: LibraryFilesQuery,
    role: LibraryUserRole,
    currentUserId: string
  ): LibraryFilesResponse {
    let items = [...source];

    if (role === 'student') {
      items = items.filter(
        (f) => f.uploadedById === currentUserId || f.uploadedById === 'unknown'
      );
    } else if (role === 'teacher') {
      items = items.filter(
        (f) =>
          f.uploadedById === currentUserId ||
          f.uploadedByRole === 'student' ||
          f.uploadedById === 'unknown'
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
      items = items.filter((f) => f.uploadedByRole === 'organization');
    } else if (tab === 'teachers' || tab === 'my') {
      if (tab === 'my') {
        items = items.filter(
          (f) => f.uploadedById === currentUserId || f.uploadedById === 'unknown'
        );
      } else {
        items = items.filter((f) => f.uploadedByRole === 'teacher');
      }
    } else if (tab === 'students' || tab === 'my-students') {
      items = items.filter((f) => f.uploadedByRole === 'student');
    }

    if (query.type && query.type !== 'all') {
      items = items.filter((f) => f.category === query.type);
    }

    if (query.uploadedBy) {
      items = items.filter((f) => f.uploadedById === query.uploadedBy);
    }

    if (query.role && query.role !== 'all') {
      items = items.filter((f) => f.uploadedByRole === query.role);
    }

    const search = query.search?.trim().toLowerCase();
    if (search) {
      items = items.filter(
        (f) =>
          f.name.toLowerCase().includes(search) ||
          f.uploadedByName.toLowerCase().includes(search) ||
          f.extension.toLowerCase().includes(search) ||
          f.category.toLowerCase().includes(search)
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
