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
import { CommonDialogComponent } from '../../components/common-dialog/common-dialog.component';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, CommonDialogComponent],
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
        profileImage: [null, Validators.required],
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
        status: ['Active'],
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
    if (this.commonService?.loginedUserInfo) {
      const loginedId = this.commonService.loginedUserInfo?.id;
      const loginedUser = this.commonService.allUsersList.find(
        (user: UserModel) => user._id === loginedId
      );
      const userFormInfo = {
        password: '',
        profileImage: '',
        status: 'Active',
        confirmPassword: '',
        role: loginedUser?.role,
        email: loginedUser?.email,
        phone: loginedUser?.phone,
        lastName: loginedUser?.lastName,
        firstName: loginedUser?.firstName,
      };
      this.profileUrl = loginedUser?.profileImage as string;
      this.registrationService.imageUrl = this.profileUrl;
      this.isAdminLogin = loginedUser?.role === 'admin';
      this.createAccountForm.setValue(userFormInfo);
      this.createAccountForm?.get('email')?.disable();
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
        .registerUserInfo(this.destroy$, this.createAccountForm.value)
        .then((clearForms) => {
          if (clearForms) {
            this.createAccountForm.reset();
            this.router.navigate(['/dashboard']);
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
}
