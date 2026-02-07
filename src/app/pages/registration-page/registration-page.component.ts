import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormValidators } from 'src/app/shared/form-validators';
import { RegistrationPageService } from './registration-page.service';
import { first, last, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/services/common.service';
import { UserModel } from '../login-page/model/user-model';
import { CommonModule } from '@angular/common';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
})
export class RegistrationPageComponent implements OnDestroy, OnInit {
  @Input() isEditMode: boolean = false;
  public getPasswordError: (arg1: FormGroup, arg2: string) => boolean;
  public isFieldInvalid: (arg1: FormGroup, arg2: string) => boolean | undefined;
  public isPasswordMismatch: (arg1: FormGroup, arg2: string, arg3: string) => boolean | null;
  public createAccountForm!: FormGroup;
  private formValidator = new FormValidators();
  private destroy$ = new Subject<void>();
  public isAdminLogin: boolean = false;
  public profileUrl: string = '../../../../assets/images/img-placeholder.jpg';
  public showPassword: boolean = false;
  public showConfirmPassword: boolean = false;
  
  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private commonService: CommonService,
    public registrationService: RegistrationPageService
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
    // Make password fields optional in edit mode
    if (this.isEditMode) {
      // Clear required validators for password fields
      this.createAccountForm.get('password')?.clearValidators();
      // Set optional validators (only validate format if password is provided)
      this.createAccountForm.get('password')?.setValidators([
        Validators.minLength(6),
        this.formValidator.customPasswordValidator.bind(this.formValidator),
      ]);
      this.createAccountForm.get('confirmPassword')?.clearValidators();
      // Update form-level validator to handle optional passwords
      this.createAccountForm.setValidators(
        this.formValidator.passwordMatchValidatorOptional.bind(this.formValidator)
      );
    }

    if (this.commonService?.loginedUserInfo) {
      const loginedId = this.commonService.loginedUserInfo?.id;
      const loginedUser = this.commonService.allUsersList.find(
        (user: UserModel) => user.id === loginedId
      ) || this.commonService.loginedUserInfo;
      
      // Use new structure with fallback to legacy fields
      const firstName = loginedUser?.first_name || loginedUser?.firstName || '';
      const lastName = loginedUser?.last_name || loginedUser?.lastName || '';
      const email = loginedUser?.contact?.email || loginedUser?.email || '';
      const phone = loginedUser?.contact?.phone || loginedUser?.phone || '';
      const profileImage = loginedUser?.profile_image || loginedUser?.profileImage || '';
      const role = loginedUser?.role || 'student';
      
      const userFormInfo = {
        password: '',
        profileImage: '',
        status: loginedUser?.status || 'active',
        confirmPassword: '',
        role: role,
        email: email,
        phone: phone,
        lastName: lastName,
        firstName: firstName,
      };
      this.profileUrl = this.commonService.decodeUrl(profileImage) as string;
      this.registrationService.imageUrl = this.profileUrl;
      this.isAdminLogin = role === 'admin';
      this.createAccountForm.setValue(userFormInfo);
      if (this.isEditMode) {
        this.createAccountForm?.get('email')?.disable();
        // Update validators after setting values
        this.createAccountForm.get('password')?.updateValueAndValidity();
        this.createAccountForm.get('confirmPassword')?.updateValueAndValidity();
      }
      this.createAccountForm?.get('role')?.disable();
      this.createAccountForm.markAllAsTouched();

      if (this.profileUrl) {
        this.createAccountForm.get('profileImage')?.clearValidators();
      }
    }
  }
  async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
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
  }
  onSubmit() {
    this.createAccountForm.markAllAsTouched();
    if (this.createAccountForm.valid) {
      this.registrationService
        .registerUserInfo(this.destroy$, this.createAccountForm.value, this.isEditMode)
        .then((clearForms) => {
          if (clearForms) {
            if (this.isEditMode) {
              // For update, refresh user info and stay on the page or navigate to dashboard
              this.commonService.loginedUserInfo = {
                ...this.commonService.loginedUserInfo,
                first_name: this.createAccountForm.get('firstName')?.value,
                last_name: this.createAccountForm.get('lastName')?.value,
                contact: {
                  email: this.createAccountForm.get('email')?.value,
                  phone: this.createAccountForm.get('phone')?.value,
                },
                profile_image: this.registrationService.imageUrl,
              };
              // Optionally navigate to dashboard or refresh the page
              // this.router.navigate(['/dashboard/account']);
            } else {
              // For new registration, reset form and navigate to login
              this.createAccountForm.reset();
              this.router.navigate(['/login']);
            }
          }
        });
    } else {
      console.error('Form is invalid');
    }
  }
  navigateLogin() {
    this.router.navigate(['/login']);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isDialogOpen = false;
  openDialog(): void {
    this.isDialogOpen = true;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
