import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { AppBranding, BrandingThemeColors } from 'src/app/core/branding/branding.model';
import { CourseApiResponse } from 'src/app/models/roster.model';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

/** Backend row shape for organization branding. */
export interface OrganizationBrandingDto {
  id?: string;
  organization_id: string;
  app_name: string;
  tagline?: string;
  logo_url?: string;
  favicon_url?: string;
  colors?: BrandingThemeColors | Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface BrandingSavePayload {
  organization_id: string;
  app_name: string;
  tagline?: string;
  logo_url?: string;
  favicon_url?: string;
  colors?: BrandingThemeColors;
}

@Injectable({ providedIn: 'root' })
export class BrandingApiService {
  private readonly _apiUrl = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  /**
   * Fetch branding for an organization.
   * Returns null when no row exists (caller should use defaults).
   */
  getBranding(organizationId: string): Observable<OrganizationBrandingDto | null> {
    if (!organizationId?.trim()) {
      throw new Error('organization_id is required');
    }

    const params = new HttpParams().set('organization_id', organizationId.trim());
    return this.http
      .get<CourseApiResponse<OrganizationBrandingDto | null>>(
        `${this._apiUrl}branding/get`,
        { params }
      )
      .pipe(
        map((res) => res?.data ?? null),
        catchError(this.commonService.handleError)
      );
  }

  /** Create or update branding. organization_id is mandatory. */
  saveBranding(payload: BrandingSavePayload): Observable<OrganizationBrandingDto> {
    if (!payload?.organization_id?.trim()) {
      throw new Error('organization_id is required');
    }
    if (!payload.app_name?.trim()) {
      throw new Error('app_name is required');
    }

    return this.http
      .post<CourseApiResponse<OrganizationBrandingDto>>(`${this._apiUrl}branding/save`, {
        organization_id: payload.organization_id.trim(),
        app_name: payload.app_name.trim(),
        tagline: payload.tagline ?? '',
        logo_url: payload.logo_url ?? '',
        favicon_url: payload.favicon_url ?? '',
        colors: payload.colors ?? {},
      })
      .pipe(
        map((res) => {
          if (!res?.data) {
            throw new Error(res?.message || 'Failed to save branding');
          }
          return res.data;
        }),
        catchError(this.commonService.handleError)
      );
  }

  /** Remove persisted branding for an organization (revert to defaults on client). */
  deleteBranding(organizationId: string): Observable<{ deleted: boolean }> {
    if (!organizationId?.trim()) {
      throw new Error('organization_id is required');
    }

    const params = new HttpParams().set('organization_id', organizationId.trim());
    return this.http
      .delete<CourseApiResponse<{ deleted: boolean }>>(`${this._apiUrl}branding`, { params })
      .pipe(
        map((res) => res?.data ?? { deleted: false }),
        catchError(this.commonService.handleError)
      );
  }

  /** Map API DTO → AppBranding (camelCase). */
  toAppBranding(dto: OrganizationBrandingDto): Partial<AppBranding> {
    return {
      appName: dto.app_name,
      tagline: dto.tagline || '',
      logoUrl: dto.logo_url || '',
      faviconUrl: dto.favicon_url || '',
      colors: (dto.colors || {}) as BrandingThemeColors,
      updatedAt: dto.updated_at,
    };
  }

  /** Map AppBranding → save payload with mandatory organization_id. */
  toSavePayload(organizationId: string, branding: AppBranding): BrandingSavePayload {
    return {
      organization_id: organizationId,
      app_name: branding.appName,
      tagline: branding.tagline,
      logo_url: branding.logoUrl,
      favicon_url: branding.faviconUrl,
      colors: branding.colors,
    };
  }
}
