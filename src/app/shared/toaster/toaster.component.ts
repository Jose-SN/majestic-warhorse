import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { TOASTER_INFO } from './toaster-info';
import { IToasterModel } from './toaster.model';
@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatIconModule],
  templateUrl: './toaster.component.html',
  styleUrl: './toaster.component.scss',
})
export class ToasterComponent {
  public toasterInfo: { [key: string]: string };
  constructor(
    public snackBarRef: MatSnackBarRef<ToasterComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public toasterData: IToasterModel
  ) {
    this.toasterInfo = {
      ...TOASTER_INFO[this.toasterData.messageType],
    };
  }
  get getTimeOut() {
    return { 'animation-duration': `${this.toasterInfo['timeoutInSeconds']}s` };
  }
}
