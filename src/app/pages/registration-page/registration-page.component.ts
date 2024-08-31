import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormValidators } from 'src/app/shared/form-validators';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
})
export class RegistrationPageComponent {
  public isFieldInvalid!: Function;
  public getPasswordError!: Function;
  public isPasswordMismatch!: Function;
  public createAccountForm!: FormGroup;
  private formValidator = new FormValidators();
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
            this.formValidator.customPasswordValidator,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validator: this.formValidator.passwordMatchValidator.bind(
          this.createAccountForm
        ),
      }
    );
    this.isFieldInvalid = this.formValidator.isFieldInvalid;
    this.getPasswordError = this.formValidator.getPasswordError;
    this.isPasswordMismatch = this.formValidator.isPasswordMismatch;
  }
  onSubmit() {
    if (this.createAccountForm.valid) {
    } else {
      console.error('Form is invalid');
    }
  }
}
