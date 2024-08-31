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
import { FormValidators } from 'src/app/shared/form-validators';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss',
})
export class ForgetPasswordComponent {
  public isFieldInvalid!: Function;
  public getPasswordError!: Function;
  public isPasswordMismatch!: Function;
  public resetPasswordForm!: FormGroup;
  private formValidator = new FormValidators();

  constructor(private formGroup: FormBuilder, private router: Router) {
    this.resetPasswordForm = this.formGroup.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            this.formValidator.customPasswordValidator,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.formValidator.customPasswordValidator }
    );
    this.isFieldInvalid = this.formValidator.isFieldInvalid;
    this.getPasswordError = this.formValidator.getPasswordError;
    this.isPasswordMismatch = this.formValidator.isPasswordMismatch;
  }

  onSubmit() {
    if (this.resetPasswordForm.valid) {
    } else {
      console.error('Form is invalid');
      this.resetPasswordForm.markAllAsTouched();
    }
  }

  gotToLoginPage() {
    this.router.navigate(['/login']);
  }
}
