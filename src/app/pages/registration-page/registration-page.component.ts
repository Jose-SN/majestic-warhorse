import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormValidators } from 'src/app/shared/form-validators';
import { RegistrationPageService } from './registration-page.service';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
})
export class RegistrationPageComponent {
  public getPasswordError: (arg1: FormGroup, arg2: string) => boolean;
  public isFieldInvalid: (arg1: FormGroup, arg2: string) => boolean | undefined;
  public isPasswordMismatch: (arg1: FormGroup, arg2: string, arg3: string) => boolean | null;
  public createAccountForm!: FormGroup;
  private formValidator = new FormValidators();
  constructor(
    private formBuilder: FormBuilder,
    public registrationService: RegistrationPageService
  ) {
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
            this.formValidator.customPasswordValidator,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validator: this.formValidator.passwordMatchValidator.bind(this.createAccountForm),
      }
    );
    this.isFieldInvalid = this.formValidator.isFieldInvalid;
    this.getPasswordError = this.formValidator.getPasswordError;
    this.isPasswordMismatch = this.formValidator.isPasswordMismatch;
  }
  onFileSelected(event: any): void {
    const isError = this.registrationService.onFileSelected(event.target.files[0]);
    if (isError) {
      this.createAccountForm.get('image')?.setValue('');
    }
  }
  onSubmit() {
    this.createAccountForm.markAllAsTouched();
    if (this.createAccountForm.valid) {
      //need to work
    } else {
      console.error('Form is invalid');
    }
  }
}
