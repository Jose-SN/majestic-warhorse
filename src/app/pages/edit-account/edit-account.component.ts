import { Component } from '@angular/core';
import { RegistrationPageComponent } from '../registration-page/registration-page.component';

@Component({
  selector: 'app-edit-account',
  standalone: true,
  imports: [RegistrationPageComponent],
  templateUrl: './edit-account.component.html',
  styleUrl: './edit-account.component.scss',
})
export class EditAccountComponent {}
