import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { IamFacade } from 'src/app/store/iam/iam.facade';
import { MailApiService } from 'src/app/services/api-service/mail-api.service';
import { CommonService } from 'src/app/shared/services/common.service';

export interface StudentApprovalRecipient {
  rosterRowId: string;
  email?: string;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class ApprovalNotificationService {
  constructor(
    private mailApi: MailApiService,
    private iam: IamFacade,
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

    return this.iam.loadOrganizations().pipe(
      map((organizations) => {
        const match = organizations.find((organization) => organization.id === organizationId);
        return match?.name?.trim() || 'Your organization';
      }),
      catchError(() => of('Your organization'))
    );
  }

  private buildStudentApprovalEmailBody(organizationName: string, studentName?: string): string {
    const greetingName = studentName?.trim() || 'there';

    return [
      `Hello ${greetingName},`,
      '',
      `Good news! ${organizationName} has approved your PetaxAI Learning account.`,
      '',
      'You can now sign in and access your organization courses and resources.',
      '',
      'If you have any questions, please contact your organization administrator.',
      '',
      '— PetaxAI Learning',
    ].join('\n');
  }
}
