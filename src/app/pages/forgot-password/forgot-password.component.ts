import { Component, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { FormValidators } from 'src/app/shared/form-validators';
import { ForgotPasswordService } from './forgot-password.service';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnDestroy {
  public isFieldInvalid: (arg1: FormGroup, arg2: string) => boolean | undefined;
  public getPasswordError: (arg1: FormGroup, arg2: string) => boolean;
  public isPasswordMismatch: (arg1: FormGroup, arg2: string, arg3: string) => boolean | null;
  public resetPasswordForm!: FormGroup;
  public otpForm!: FormGroup;
  private formValidator = new FormValidators();
  private destroy$ = new Subject<void>();
  public showOtpSection: boolean = false;

  constructor(
    private formGroup: FormBuilder,
    private router: Router,
    private forgotPasswordService: ForgotPasswordService,
    private commonService: CommonService,
  ) {
    this.resetPasswordForm = this.formGroup.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(6), this.formValidator.customPasswordValidator],
      ],
      confirmPassword: ['', [Validators.required]],
    });
    this.otpForm = this.formGroup.group({
      email: ['', [Validators.required, Validators.email]],
      userId: ['', [Validators.required]],
      otp: ['', [Validators.required]],
      password: ['', Validators.required]
    });
    this.isFieldInvalid = this.formValidator.isFieldInvalid;
    this.getPasswordError = this.formValidator.getPasswordError;
    this.isPasswordMismatch = this.formValidator.isPasswordMismatch;
  }

  onSubmit() {
    if (this.resetPasswordForm.valid) {
      const resetPasswordForm = this.resetPasswordForm.value;
      delete resetPasswordForm.confirmPassword;
      this.forgotPasswordService.updatePassword(this.destroy$, resetPasswordForm).then((data: any) => {
        if (data.success) {
          this.commonService.openToaster({
            message: 'An OTP has been sent to your registered email.',
            messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
          });
          setTimeout(() => {
            this.otpForm.get('email')?.setValue(resetPasswordForm.email);
            this.otpForm.get('email')?.disable();
            this.otpForm.get('userId')?.setValue(data.data.userId);
            this.otpForm.get('password')?.setValue(resetPasswordForm.password);
            this.showOtpSection = true;
          }, 1000);
        } else {
          this.showOtpSection = false;
          this.commonService.openToaster({
            message: 'Error while sending OTP.',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        }
      }).catch((error) => {
        this.showOtpSection = false;
        this.commonService.openToaster({
          message: 'Error while updating password.',
          messageType: TOASTER_MESSAGE_TYPE.ERROR,
        });
      })
    } else {
      this.showOtpSection = false;
      console.error('Form is invalid');
      this.resetPasswordForm.markAllAsTouched();
    }
  }

  onSubmitOtp() {
    if (this.otpForm.valid) {
      const otpForm = this.otpForm.value;
      this.forgotPasswordService.validateOtp(this.destroy$, otpForm).then((otpUpdated: any) => {
        const response = JSON.parse(otpUpdated);
        if (response.success) {
          this.commonService.openToaster({
            message: 'Password successfully updated.',
            messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
          });
          setTimeout(() => {
            this.router.navigate([`/login`]);
          }, 1000);
        } else {
          this.commonService.openToaster({
            message: 'Error while updating password.',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        }
      }).catch((error) => {
        const response = JSON.parse(error);
        this.commonService.openToaster({
          message: response.error,
          messageType: TOASTER_MESSAGE_TYPE.ERROR,
        });
      })
    } else {
      console.error('Form is invalid');
      this.otpForm.markAllAsTouched();
    }
  }

  gotoForgotPassword() {
    this.showOtpSection = false;
  }

  gotToLoginPage() {
    this.router.navigate(['/login']);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  sendResetPassword() {
    
  }
}
