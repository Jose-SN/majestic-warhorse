import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { MailApiService } from 'src/app/services/api-service/mail-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import type { Organization } from 'src/app/models/organization.model';

export interface StudentApprovalRecipient {
  rosterRowId: string;
  email?: string;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class ApprovalNotificationService {
  constructor(
    private mailApi: MailApiService,
    private organizationApi: OrganizationApiService,
    private commonService: CommonService
  ) {}

  sendStudentApprovalEmails(recipients: StudentApprovalRecipient[]): Observable<void> {
    const deliverable = recipients
      .map((recipient) => ({
        ...recipient,
        email: recipient.email?.trim() ?? '',
      }))
      .filter((recipient) => !!recipient.email);

    if (!deliverable.length) {
      return of(void 0);
    }

    return this.resolveOrganizationName().pipe(
      switchMap((organizationName) => {
        const requests = deliverable.map((recipient) =>
          this.mailApi
            .sendGmail({
              to: recipient.email,
              subject: `${organizationName} approved your account`,
              body: this.buildStudentApprovalEmailBody(organizationName, recipient.name),
            })
            .pipe(catchError(() => of(null)))
        );

        return forkJoin(requests).pipe(
          map(() => void 0),
          catchError(() => of(void 0))
        );
      }),
      catchError(() => of(void 0))
    );
  }

  private resolveOrganizationName(): Observable<string> {
    const fromSession = sessionStorage.getItem('activeOrganizationName')?.trim();
    if (fromSession) {
      return of(fromSession);
    }

    const loggedInUser = this.commonService.loginedUserInfo;
    if (loggedInUser?.role === 'organization' && loggedInUser.name?.trim()) {
      return of(loggedInUser.name.trim());
    }

    const organizationId = sessionStorage.getItem('organization_id')?.trim();
    if (!organizationId) {
      return of('Your organization');
    }

    return this.organizationApi.getOrganizations().pipe(
      map((response) => {
        const organizations = this.extractOrganizations(response);
        const match = organizations.find((organization) => organization.id === organizationId);
        return match?.name?.trim() || 'Your organization';
      }),
      catchError(() => of('Your organization'))
    );
  }

  private extractOrganizations(response: unknown): Organization[] {
    if (Array.isArray(response)) {
      return response as Organization[];
    }
    const data = (response as { data?: Organization[] })?.data;
    return Array.isArray(data) ? data : [];
  }

  private buildStudentApprovalEmailBody(organizationName: string, studentName?: string): string {
    const greetingName = studentName?.trim() || 'there';

    return [
      `Hello ${greetingName},`,
      '',
      `Good news! ${organizationName} has approved your Majestic Academy account.`,
      '',
      'You can now sign in and access your organization courses and resources.',
      '',
      'If you have any questions, please contact your organization administrator.',
      '',
      '— Majestic Academy',
    ].join('\n');
  }
}
