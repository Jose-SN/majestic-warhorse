import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { DemoModeService } from 'src/app/shared/services/demo-mode.service';

@Component({
  selector: 'app-demo-mode-banner',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './demo-mode-banner.component.html',
  styleUrl: './demo-mode-banner.component.scss',
})
export class DemoModeBannerComponent {
  constructor(public demoModeService: DemoModeService) {}

  exitDemoMode(): void {
    this.demoModeService.setDemoMode(false, { animate: true });
  }
}
