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
  private formValidator = new FormValidators();
  private destroy$ = new Subject<void>();

  constructor(
    private formGroup: FormBuilder,
    private router: Router,
    private forgotPasswordService: ForgotPasswordService
  ) {
    this.resetPasswordForm = this.formGroup.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(6), this.formValidator.customPasswordValidator],
      ],
      confirmPassword: ['', [Validators.required]],
    });
    this.isFieldInvalid = this.formValidator.isFieldInvalid;
    this.getPasswordError = this.formValidator.getPasswordError;
    this.isPasswordMismatch = this.formValidator.isPasswordMismatch;
  }

  onSubmit() {
    if (this.resetPasswordForm.valid) {
      const resetPasswordForm = this.resetPasswordForm.value;
      delete resetPasswordForm.confirmPassword;
      this.forgotPasswordService.updatePassword(this.destroy$, resetPasswordForm);
    } else {
      console.error('Form is invalid');
      this.resetPasswordForm.markAllAsTouched();
    }
  }

  gotToLoginPage() {
    this.router.navigate(['/login']);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
