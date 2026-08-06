export type LibraryUserRole = 'organization' | 'teacher' | 'student';

export type LibraryFileCategory = 'video' | 'document' | 'image' | 'audio' | 'other';

export type LibraryTabId =
  | 'all'
  | 'organizations'
  | 'teachers'
  | 'students'
  | 'my'
  | 'my-students'
  | 'videos'
  | 'documents'
  | 'images';

export type LibraryFileItem = {
  id: string;
  name: string;
  extension: string;
  category: LibraryFileCategory;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  uploadedByName: string;
  uploadedByRole: LibraryUserRole;
  uploadedAt: string;
  previewUrl?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
};

export type LibraryCategoryStats = {
  count: number;
  sizeGb: number;
};

export type LibraryStats = {
  quotaGb: number;
  usedGb: number;
  remainingGb: number;
  percentUsed: number;
  videos: LibraryCategoryStats;
  documents: LibraryCategoryStats;
  images: LibraryCategoryStats;
  others: LibraryCategoryStats;
};

export type LibraryUsageUserType = 'teacher' | 'student';

export type LibraryUsageFilter = 'all' | LibraryUsageUserType;

export type LibraryUserUsage = {
  userId: string;
  userType: LibraryUsageUserType;
  userName: string;
  files: number;
  usedGb: number;
  remainingGb: number;
};

export type LibraryFilesQuery = {
  page: number;
  limit: number;
  search?: string;
  type?: LibraryFileCategory | 'all';
  tab?: LibraryTabId;
  uploadedBy?: string;
  role?: LibraryUserRole | 'all';
};

export type LibraryFilesResponse = {
  items: LibraryFileItem[];
  page: number;
  totalPages: number;
  totalItems: number;
};

export type LibraryUploadResult = {
  item: LibraryFileItem;
};
