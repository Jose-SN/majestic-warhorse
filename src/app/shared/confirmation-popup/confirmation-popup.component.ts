import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IConfirmationPopupConfig } from './confirmation-popup.model';

@Component({
  selector: 'app-confirmation-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-popup.component.html',
  styleUrl: './confirmation-popup.component.scss',
})
export class ConfirmationPopupComponent {
  @Input() config: IConfirmationPopupConfig | null = null;
  @Output() result = new EventEmitter<boolean>();

  onConfirm(): void {
    this.result.emit(true);
  }

  onCancel(): void {
    this.result.emit(false);
  }
}
