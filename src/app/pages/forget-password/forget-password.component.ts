import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss',
})
export class ForgetPasswordComponent {
  resetPasswordForm!: FormGroup;

  constructor(private formGroup: FormBuilder, private router: Router) {
    this.resetPasswordForm = this.formGroup.group(
      {
        email: ['', [Validators.required, Validators.email]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            this.customPasswordValidator,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  onSubmit() {
    if (this.resetPasswordForm.valid) {
    } else {
      console.error('Form is invalid');
      this.resetPasswordForm.markAllAsTouched();
    }
  }

  // Custom validator for password strength
  customPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const errors: any = {};

    if (!value) {
      return null; // Don't validate empty values
    }

    if (value.length < 6) {
      errors.minlength = {
        requiredLength: 6,
        actualLength: value.length,
      };
    }

    if (!/[A-Z]/.test(value)) {
      errors.uppercase = 'Password must contain at least one uppercase letter.';
    }

    if (!/[a-z]/.test(value)) {
      errors.lowercase = 'Password must contain at least one lowercase letter.';
    }

    if (!/\d/.test(value)) {
      errors.number = 'Password must contain at least one number.';
    }

    if (!/[@$!%*?&]/.test(value)) {
      errors.special = 'Password must contain at least one special character.';
    }

    return Object.keys(errors).length ? errors : null;
  }

  // Custom validator to check if newPassword and confirmPassword match
  passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  // Helper methods to check validation status
  isFieldInvalid(fieldName: string): boolean | undefined {
    const field = this.resetPasswordForm.get(fieldName);
    return field?.invalid && (field.touched || field.dirty);
  }

  isPasswordMismatch(): boolean {
    const field = this.resetPasswordForm.get('confirmPassword');
    return field?.errors?.['mismatch'] && (field.touched || field.dirty);
  }

  // Helper method to get specific error messages
  getPasswordError(errorName: string): boolean {
    const field = this.resetPasswordForm.get('newPassword');
    return field?.errors?.[errorName] && (field.touched || field.dirty);
  }
  gotToLoginPage() {
    this.router.navigate(['/login']);
  }
}
