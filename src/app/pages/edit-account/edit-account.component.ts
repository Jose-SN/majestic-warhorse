import { Component } from '@angular/core';
import { AccountSettingsComponent } from '../account-settings/account-settings.component';

@Component({
  selector: 'app-edit-account',
  standalone: true,
  imports: [AccountSettingsComponent],
  templateUrl: './edit-account.component.html',
  styleUrl: './edit-account.component.scss',
})
export class EditAccountComponent {}
