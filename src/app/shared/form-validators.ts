import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export class FormValidators {
  customPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    // If no value, return null (let required validator handle empty values, or allow empty in edit mode)
    if (!value || value.trim() === '') {
      return null;
    }
    const errors: { [key: string]: string } = {};
    if (!/[A-Z]/.test(value)) {
      errors['uppercase'] = 'Password must contain at least one uppercase letter.';
    }
    if (!/[a-z]/.test(value)) {
      errors['lowercase'] = 'Password must contain at least one lowercase letter.';
    }
    if (!/\d/.test(value)) {
      errors['number'] = 'Password must contain at least one number.';
    }
    if (!/[@$!%*?&]/.test(value)) {
      errors['special'] = 'Password must contain at least one special character.';
    }
    return Object.keys(errors)?.length ? errors : null;
  }
  passwordMatchValidator(registrationForm: FormGroup): ValidationErrors | null {
    const password = registrationForm?.get('password')?.value;
    const confirmPassword = registrationForm?.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }
  passwordMatchValidatorOptional(registrationForm: AbstractControl): ValidationErrors | null {
    if (!(registrationForm instanceof FormGroup)) {
      return null;
    }
    const password = registrationForm.get('password')?.value;
    const confirmPassword = registrationForm.get('confirmPassword')?.value;
    // Only validate if at least one password field has a value
    if (!password && !confirmPassword) {
      return null; // Both empty is valid in edit mode
    }
    // If one is filled, both must match
    if (password && confirmPassword) {
      return password === confirmPassword ? null : { mismatch: true };
    }
    // If only one is filled, it's invalid
    if ((password && !confirmPassword) || (!password && confirmPassword)) {
      return { mismatch: true };
    }
    return null;
  }
  isFieldInvalid(registrationForm: FormGroup, fieldName: string): boolean | undefined {
    const field = registrationForm?.get(fieldName);
    return field?.invalid && (field?.touched || field?.dirty);
  }

  isPasswordMismatch(
    registrationForm: FormGroup,
    password: string,
    confirmPassword: string
  ): boolean | null {
    return (
      registrationForm?.get(confirmPassword)?.value &&
      registrationForm?.get(password)?.value !== registrationForm?.get(confirmPassword)?.value
    );
  }
  getPasswordError(registrationForm: FormGroup, errorName: string): boolean {
    const field = registrationForm?.get('password');
    return field?.errors?.[errorName] && (field.touched || field.dirty);
  }
}
