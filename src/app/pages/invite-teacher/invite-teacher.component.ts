import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RosterRegistrationService } from 'src/app/services/api-service/roster-registration.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { DASHBOARD_NAV_ROUTES } from '../dashboard/dashboard-routes.config';

@Component({
  selector: 'app-invite-teacher',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './invite-teacher.component.html',
  styleUrl: './invite-teacher.component.scss',
})
export class InviteTeacherComponent implements OnDestroy {
  readonly navRoutes = DASHBOARD_NAV_ROUTES;
  inviteForm: FormGroup;
  submitting = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private rosterRegistration: RosterRegistrationService,
    private commonService: CommonService,
    private router: Router
  ) {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: [''],
    });
  }

  get organizationId(): string {
    return sessionStorage.getItem('organization_id') || '';
  }

  isInvalid(field: string): boolean {
    const control = this.inviteForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  async onSubmit(): Promise<void> {
    this.inviteForm.markAllAsTouched();
    if (this.inviteForm.invalid || this.submitting) return;

    const orgId = this.organizationId;
    if (!orgId) {
      this.commonService.openToaster({
        message: 'No active organization selected. Please switch organization first.',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
      return;
    }

    this.submitting = true;
    const { email, firstName, lastName, phone } = this.inviteForm.value;

    try {
      await this.rosterRegistration.registerOnRoster({
        organizationId: orgId,
        role: 'teacher',
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        status: 'pending',
      });
      this.commonService.openToaster({
        message:
          'Teacher added to roster. Approve them under Teachers Approval, then they can create courses.',
        messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
      });
      this.inviteForm.reset();
      this.router.navigate([this.navRoutes.teacherApproval]);
    } catch {
      this.commonService.openToaster({
        message: 'Failed to add teacher to roster. Please try again.',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    } finally {
      this.submitting = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
