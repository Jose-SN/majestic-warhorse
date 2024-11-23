import { Component, EventEmitter, Output } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-common-dialog',
  standalone: true,
  imports: [],
  templateUrl: './common-dialog.component.html',
  styleUrl: './common-dialog.component.scss',
  animations: [
    trigger('dialogAnimation', [
      state('void', style({ transform: 'scale(0.9)', opacity: 0 })),
      transition(':enter', [
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'scale(0.9)', opacity: 0 }))
      ])
    ])
  ]
})
export class CommonDialogComponent {
  @Output() closed = new EventEmitter<boolean>();

  close(): void {
    this.closed.emit(false);
  }
}
