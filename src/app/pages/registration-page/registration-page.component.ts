import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule,CommonModule],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
})
export class RegistrationPageComponent {

  public createAccountForm!: FormGroup;
  constructor(private formBuilder: FormBuilder) {
    this.createAccountForm = this.formBuilder.group(
      {
        username: ['', [Validators.required]],
        image: [null, Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: [
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
    if (this.createAccountForm.valid) {
    } else {
      console.error('Form is invalid');
    }
  }
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.createAccountForm.patchValue({
        image: file,
      });
    }
  }
  customPasswordValidator(control: any) {
    const value = control.value;
    const errors: any = {};
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
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }
  isFieldInvalid(fieldName: string): boolean | undefined {
    const field = this.createAccountForm.get(fieldName);
    return field?.invalid && (field.touched || field.dirty);
  }

  isPasswordMismatch(): boolean | null {
    return (
      this.createAccountForm.get('confirmPassword')?.value &&
      this.createAccountForm.get('confirmPassword')?.value !==
        this.createAccountForm.get('confirmPassword')
    );
  }
  getPasswordError(errorName: string): boolean {
    const field = this.createAccountForm.get('password');
    return field?.errors?.[errorName] && (field.touched || field.dirty);
  }
}
