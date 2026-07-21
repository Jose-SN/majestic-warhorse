import { Component, ElementRef, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormValidators } from 'src/app/shared/form-validators';
import { RegistrationPageService } from './registration-page.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/services/common.service';
import { UserModel, isOrganization } from '../login-page/model/user-model';
import type { Organization } from 'src/app/models/organization.model';
import { CommonModule } from '@angular/common';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { decodeText } from 'src/app/shared/utils/utils';
import { OAuthService } from 'src/app/core/auth/oauth.service';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
})
export class RegistrationPageComponent implements OnDestroy, OnInit {
  @HostBinding('class.signup-standalone')
  readonly isSignupStandalone = true;

  public getPasswordError: (arg1: FormGroup, arg2: string) => boolean;
  public isFieldInvalid: (arg1: FormGroup, arg2: string) => boolean | undefined;
  public isPasswordMismatch: (arg1: FormGroup, arg2: string, arg3: string) => boolean | null;
  public createAccountForm!: FormGroup;
  private formValidator = new FormValidators();
  private destroy$ = new Subject<void>();
  /** true when org is logged in OR user chose to register organization (public signup) */
  public isAdminLogin: boolean = false;
  /** Toggle for public: register as user (student/teacher) vs organization */
  public registrationMode: 'user' | 'organization' = 'user';
  public profileUrl: string = '../../../../assets/images/img-placeholder.jpg';

  setRegistrationMode(mode: 'user' | 'organization') {
    this.registrationMode = mode;
    this.isAdminLogin = mode === 'organization';
    this.createAccountForm.patchValue({ role: mode === 'organization' ? 'organization' : 'student' });
  }
  public showPassword: boolean = false;
  public showConfirmPassword: boolean = false;
  public isGoogleLoading: boolean = false;
  public organizationsList: Organization[] = [];
  @ViewChild('profileImageInput') profileImageInput!: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private commonService: CommonService,
    public registrationService: RegistrationPageService,
    private organizationApiService: OrganizationApiService,
    private oauthService: OAuthService
  ) {
    this.createAccountForm = this.formBuilder.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', []],
        profileImage: [''],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern('^\\+?\\d{10,15}$')]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            this.formValidator.customPasswordValidator,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        role: ['student', [Validators.required]],
        status: ['active'],
        organization_id: [''],
        name: [''],
      },
      {
        validator: this.formValidator.passwordMatchValidator.bind(this.createAccountForm),
      }
    );
    this.isFieldInvalid = this.formValidator.isFieldInvalid;
    this.getPasswordError = this.formValidator.getPasswordError;
    this.isPasswordMismatch = this.formValidator.isPasswordMismatch;
  }

  ngOnInit(): void {
    this.loadOrganizations();
    this.setupRoleValidators();

    if (this.commonService?.loginedUserInfo) {
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
      this.createAccountForm.setValue(userFormInfo);
      this.createAccountForm?.get('role')?.disable();
      this.createAccountForm?.get('organization_id')?.disable();
      this.createAccountForm.markAllAsTouched();

      if (this.profileUrl) {
        this.createAccountForm.get('profileImage')?.clearValidators();
      }
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('type') === 'organization') {
        this.registrationMode = 'organization';
        this.isAdminLogin = true;
        this.createAccountForm.patchValue({ role: 'organization' });
      }
    }
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
      this.createAccountForm.get('profileImage')?.setValue('');
      this.commonService.openToaster({
        message: 'Error while uploading image, please re-upload',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    }
    target.value = '';
  }

  onSubmit() {
    this.createAccountForm.markAllAsTouched();
    if (this.createAccountForm.valid) {
      const userFormInfo = this.createAccountForm.getRawValue();
      userFormInfo.email =
        this.createAccountForm.get('email')?.value || this.commonService.loginedUserInfo?.contact?.email || '';
      userFormInfo.phone = this.createAccountForm.get('phone')?.value || this.commonService.loginedUserInfo?.contact?.phone || '';
      userFormInfo.firstName = this.createAccountForm.get('firstName')?.value;
      userFormInfo.lastName = this.createAccountForm.get('lastName')?.value;
      userFormInfo.profileImage = this.registrationService.imageUrl;
      userFormInfo.role = this.createAccountForm.get('role')?.value;
      userFormInfo.status = this.createAccountForm.get('status')?.value;
      userFormInfo.password = this.createAccountForm.get('password')?.value;
      userFormInfo.confirmPassword = this.createAccountForm.get('confirmPassword')?.value;
      userFormInfo.organization_id = this.createAccountForm.get('organization_id')?.value;
      userFormInfo.name = this.createAccountForm.get('name')?.value;
      this.registrationService.registerUserInfo(this.destroy$, userFormInfo, false).then((clearForms) => {
        if (clearForms) {
          if (this.isAdminLogin || this.createAccountForm.get('role')?.value === 'organization') {
            this.createAccountForm.reset();
            this.router.navigate(['/login']);
          }
        }
      });
    } else {
      console.error('Form is invalid');
    }
  }

  private setupRoleValidators(): void {
    const roleControl = this.createAccountForm.get('role');
    const nameControl = this.createAccountForm.get('name');
    const orgIdControl = this.createAccountForm.get('organization_id');
    const firstNameControl = this.createAccountForm.get('firstName');

    const updateValidators = () => {
      const role = roleControl?.value;
      if (role === 'organization') {
        nameControl?.setValidators([Validators.required]);
        orgIdControl?.clearValidators();
        firstNameControl?.clearValidators();
      } else {
        nameControl?.clearValidators();
        orgIdControl?.setValidators([Validators.required]);
        firstNameControl?.setValidators([Validators.required]);
      }
      nameControl?.updateValueAndValidity();
      orgIdControl?.updateValueAndValidity();
      firstNameControl?.updateValueAndValidity();
    };

    roleControl?.valueChanges.subscribe(() => updateValidators());
    updateValidators();
  }

  loadOrganizations(): void {
    this.organizationApiService
      .getOrganizations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = Array.isArray(response) ? response : (response as any)?.data;
          this.organizationsList = data ?? [];
          if (data.length > 0) {
            this.createAccountForm.get('organization_id')?.setValue(this.organizationsList[0].id);
          }
        },
        error: (err) => {
          console.error('Error loading organizations:', err);
        },
      });
  }

  async signInWithGoogle(): Promise<void> {
    if (this.isGoogleLoading) return;
    this.isGoogleLoading = true;
    try {
      const accountType = this.isAdminLogin ? 'organization' : 'user';
      await this.oauthService.signInWithGoogle(accountType);
    } catch (error: any) {
      this.isGoogleLoading = false;
      this.commonService.openToaster({
        message: error?.message || 'Unable to start Google sign-in. Please try again.',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    }
  }

  navigateLogin() {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
