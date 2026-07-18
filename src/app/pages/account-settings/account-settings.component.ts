import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import type { Organization } from 'src/app/models/organization.model';
import { UserModel, isOrganization } from '../login-page/model/user-model';
import { RegistrationPageService } from '../registration-page/registration-page.service';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormValidators } from 'src/app/shared/form-validators';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { decodeText } from 'src/app/shared/utils/utils';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
  public getPasswordError: (arg1: FormGroup, arg2: string) => boolean;
  public isFieldInvalid: (arg1: FormGroup, arg2: string) => boolean | undefined;
  public isPasswordMismatch: (arg1: FormGroup, arg2: string, arg3: string) => boolean | null;

  accountForm!: FormGroup;
  profileUrl = '../../../../assets/images/img-placeholder.jpg';
  showPassword = false;
  showConfirmPassword = false;
  isAdminLogin = false;
  organizationsList: Organization[] = [];

  private formValidator = new FormValidators();
  private destroy$ = new Subject<void>();
  private initialFormSnapshot: Record<string, unknown> | null = null;

  @ViewChild('profileImageInput') profileImageInput!: ElementRef<HTMLInputElement>;

  constructor(
    private formBuilder: FormBuilder,
    private commonService: CommonService,
    private registrationService: RegistrationPageService,
    private organizationApiService: OrganizationApiService
  ) {
    this.accountForm = this.formBuilder.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', []],
        profileImage: [''],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern('^\\+?\\d{10,15}$')]],
        password: ['', [Validators.minLength(6), this.formValidator.customPasswordValidator.bind(this.formValidator)]],
        confirmPassword: [''],
        role: ['student', [Validators.required]],
        status: ['active'],
        organization_id: [''],
        name: [''],
      },
      {
        validators: this.formValidator.passwordMatchValidatorOptional.bind(this.formValidator),
      }
    );

    this.isFieldInvalid = this.formValidator.isFieldInvalid;
    this.getPasswordError = this.formValidator.getPasswordError;
    this.isPasswordMismatch = this.formValidator.isPasswordMismatch;
  }

  ngOnInit(): void {
    this.loadOrganizations();
    this.setupRoleValidators();
    this.loadLoggedInUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  unescapeHtml(text: string): string {
    return decodeText(text);
  }

  triggerFileInput(): void {
    this.profileImageInput?.nativeElement?.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files?.length) return;

    const successData: { [key: string]: string | boolean } =
      await this.registrationService.onFileSelected(this.destroy$, files[0]);

    if (successData['success']) {
      this.profileUrl = successData['url'] as string;
    } else {
      this.accountForm.get('profileImage')?.setValue('');
      this.commonService.openToaster({
        message: 'Error while uploading image, please re-upload',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    }
    target.value = '';
  }

  onSubmit(): void {
    this.accountForm.markAllAsTouched();
    if (!this.accountForm.valid) {
      return;
    }

    const userFormInfo = this.accountForm.getRawValue();
    userFormInfo.email =
      this.accountForm.get('email')?.value || this.commonService.loginedUserInfo?.contact?.email || '';
    userFormInfo.phone = this.accountForm.get('phone')?.value || '';
    userFormInfo.firstName = this.accountForm.get('firstName')?.value;
    userFormInfo.lastName = this.accountForm.get('lastName')?.value;
    userFormInfo.profileImage = this.registrationService.imageUrl;
    userFormInfo.role = this.accountForm.get('role')?.value;
    userFormInfo.status = this.accountForm.get('status')?.value;
    userFormInfo.password = this.accountForm.get('password')?.value;
    userFormInfo.confirmPassword = this.accountForm.get('confirmPassword')?.value;
    userFormInfo.organization_id = this.accountForm.get('organization_id')?.value;
    userFormInfo.name = this.accountForm.get('name')?.value;

    this.registrationService.registerUserInfo(this.destroy$, userFormInfo, true).then((success) => {
      if (!success) {
        return;
      }

      this.commonService.loginedUserInfo = {
        ...this.commonService.loginedUserInfo,
        first_name: this.accountForm.get('firstName')?.value,
        last_name: this.accountForm.get('lastName')?.value,
        contact: {
          email: this.accountForm.get('email')?.value,
          phone: this.accountForm.get('phone')?.value,
        },
        profile_image: this.registrationService.imageUrl,
      };

      this.accountForm.patchValue({ password: '', confirmPassword: '' });
      this.captureFormSnapshot();
    });
  }

  resetForm(): void {
    if (!this.initialFormSnapshot) {
      return;
    }
    this.accountForm.reset(this.initialFormSnapshot);
    this.profileUrl = this.registrationService.imageUrl;
    this.accountForm.get('email')?.disable({ emitEvent: false });
    this.accountForm.get('role')?.disable({ emitEvent: false });
    this.accountForm.get('organization_id')?.disable({ emitEvent: false });
    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  get currentRole(): string {
    return this.accountForm.get('role')?.value ?? 'student';
  }

  get systemId(): string {
    const id = this.commonService.loginedUserInfo?.id;
    if (!id) {
      return 'PENDING';
    }
    const token = String(id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const prefix = token.slice(0, 4).padEnd(4, '0');
    const suffix = token.slice(-3).padStart(3, '0');
    return `${prefix}-NWX-${suffix}`;
  }

  get displayName(): string {
    if (this.isAdminLogin && this.currentRole === 'organization') {
      return this.accountForm.get('name')?.value || 'Organization';
    }
    const first = this.accountForm.get('firstName')?.value || '';
    const last = this.accountForm.get('lastName')?.value || '';
    return `${first} ${last}`.trim() || 'User';
  }

  get roleLabel(): string {
    const labels: Record<string, string> = {
      student: 'Student',
      teacher: 'Teacher',
      organization: 'Organization',
    };
    return labels[this.currentRole] || this.currentRole;
  }

  get roleSubtitle(): string {
    const subtitles: Record<string, string> = {
      student: 'Learning Node',
      teacher: 'Senior Neural Instructor',
      organization: 'Organization Administrator',
    };
    return subtitles[this.currentRole] || roleLabelFallback(this.currentRole);
  }

  get emailDisplay(): string {
    return (
      this.accountForm.get('email')?.value ||
      this.commonService.loginedUserInfo?.contact?.email ||
      ''
    );
  }

  get organizationDisplayName(): string {
    if (this.isAdminLogin && this.currentRole === 'organization') {
      return this.accountForm.get('name')?.value || '—';
    }
    const orgId = this.accountForm.get('organization_id')?.value;
    const org = this.organizationsList.find((item) => item.id === orgId);
    if (!org) {
      return '—';
    }
    return this.unescapeHtml(org.name || '') || String(org.id);
  }

  get accountStatus(): string {
    const status = this.accountForm.get('status')?.value || 'active';
    return String(status).charAt(0).toUpperCase() + String(status).slice(1);
  }

  get lastAccessLabel(): string {
    const updated = (this.commonService.loginedUserInfo as { updated_at?: string })?.updated_at;
    if (!updated) {
      return 'Today';
    }
    const date = new Date(updated);
    if (Number.isNaN(date.getTime())) {
      return 'Today';
    }
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private loadLoggedInUser(): void {
    if (!this.commonService?.loginedUserInfo) {
      return;
    }

    const loginedId = this.commonService.loginedUserInfo?.id;
    const loginedUser: UserModel | Organization =
      (this.commonService.allUsersList.find((user: UserModel) => user.id === loginedId) as UserModel) ||
      this.commonService.loginedUserInfo;

    const firstName = !isOrganization(loginedUser)
      ? loginedUser?.first_name || loginedUser?.firstName || ''
      : '';
    const lastName = !isOrganization(loginedUser)
      ? loginedUser?.last_name || loginedUser?.lastName || ''
      : '';
    const email = loginedUser?.contact?.email || (loginedUser as UserModel)?.email || '';
    const phone = loginedUser?.contact?.phone || (loginedUser as UserModel)?.phone || '';
    const profileImage = loginedUser?.profile_image || (loginedUser as UserModel)?.profileImage || '';
    const role =
      (loginedUser as UserModel)?.role || (isOrganization(loginedUser) ? 'organization' : 'student');
    const orgName = isOrganization(loginedUser) ? loginedUser.name : (loginedUser as UserModel)?.name || '';

    const userFormInfo = {
      password: '',
      profileImage: '',
      status: (loginedUser as UserModel)?.status || 'active',
      confirmPassword: '',
      role,
      email,
      phone,
      lastName,
      firstName,
      organization_id: (loginedUser as UserModel)?.organization_id || '',
      name: orgName,
    };

    this.profileUrl = this.commonService.decodeUrl(profileImage) as string;
    this.registrationService.imageUrl = this.profileUrl;
    this.isAdminLogin = role === 'organization';
    this.accountForm.setValue(userFormInfo);

    this.accountForm.get('email')?.disable();
    this.accountForm.get('role')?.disable();
    this.accountForm.get('organization_id')?.disable();
    this.accountForm.get('password')?.updateValueAndValidity();
    this.accountForm.get('confirmPassword')?.updateValueAndValidity();

    if (this.profileUrl) {
      this.accountForm.get('profileImage')?.clearValidators();
    }

    this.captureFormSnapshot();
  }

  private captureFormSnapshot(): void {
    this.initialFormSnapshot = this.accountForm.getRawValue();
  }

  private setupRoleValidators(): void {
    const roleControl = this.accountForm.get('role');
    const nameControl = this.accountForm.get('name');
    const orgIdControl = this.accountForm.get('organization_id');
    const firstNameControl = this.accountForm.get('firstName');

    const updateValidators = () => {
      const role = roleControl?.value;
      if (role === 'organization') {
        nameControl?.setValidators([Validators.required]);
        orgIdControl?.clearValidators();
        firstNameControl?.clearValidators();
      } else {
        nameControl?.clearValidators();
        orgIdControl?.clearValidators();
        firstNameControl?.setValidators([Validators.required]);
      }
      nameControl?.updateValueAndValidity({ emitEvent: false });
      orgIdControl?.updateValueAndValidity({ emitEvent: false });
      firstNameControl?.updateValueAndValidity({ emitEvent: false });
    };

    roleControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => updateValidators());
    updateValidators();
  }

  private loadOrganizations(): void {
    this.organizationApiService
      .getOrganizations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = Array.isArray(response) ? response : (response as { data?: Organization[] })?.data;
          this.organizationsList = data ?? [];
        },
        error: (err) => {
          console.error('Error loading organizations:', err);
        },
      });
  }
}

function roleLabelFallback(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
