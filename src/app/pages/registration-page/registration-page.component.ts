import { Component, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormValidators } from 'src/app/shared/form-validators';
import { RegistrationPageService } from './registration-page.service';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
})
export class RegistrationPageComponent implements OnDestroy {
  public getPasswordError: (arg1: FormGroup, arg2: string) => boolean;
  public isFieldInvalid: (arg1: FormGroup, arg2: string) => boolean | undefined;
  public isPasswordMismatch: (arg1: FormGroup, arg2: string, arg3: string) => boolean | null;
  public createAccountForm!: FormGroup;
  private formValidator = new FormValidators();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    public registrationService: RegistrationPageService
  ) {
    this.createAccountForm = this.formBuilder.group(
      {
        userName: ['', [Validators.required]],
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
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    const isError = this.registrationService.onFileSelected(this.destroy$, files[0]);
    if (isError) {
      this.createAccountForm.get('image')?.setValue('');
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
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
