import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-common-dialog',
  standalone: true,
  imports: [CommonModule], // Include CommonModule for ngTemplateOutlet and other directives
  templateUrl: './common-dialog.component.html',
  styleUrl: './common-dialog.component.scss',
  animations: [
    trigger('dialogAnimation', [
      state('void', style({ transform: 'scale(0.9)', opacity: 0 })),
      transition(':enter', [
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'scale(0.9)', opacity: 0 })),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonDialogComponent {
  public title: string = '';
  @Output() closed = new EventEmitter<boolean>();
  @ViewChild('popupContainer', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;
  
  loadComponent(component: any, inputs?: { [key: string]: any }) {
    this.container.clear();
    const componentRef: any = this.container.createComponent(component);
    if (inputs) {
      Object.keys(inputs).forEach((key) => {
        componentRef.instance[key] = inputs[key];
      });
    }
  }
  close(): void {
    this.closed.emit(false);
  }
}
