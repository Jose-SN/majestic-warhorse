import { FormGroup } from '@angular/forms';

export class FormValidators {
  customPasswordValidator(control: { [key: string]: string }) {
    const value = control['value'];
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
  passwordMatchValidator(registrationForm: FormGroup) {
    const password = registrationForm?.get('password')?.value;
    const confirmPassword = registrationForm?.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
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
