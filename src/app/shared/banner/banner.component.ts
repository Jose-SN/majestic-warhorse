import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { CommonService } from 'src/app/shared/services/common.service';
import { DemoModeService } from 'src/app/shared/services/demo-mode.service';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
})
export class BannerComponent {
  constructor(
    public demoModeService: DemoModeService,
    private commonService: CommonService
  ) {}

  get showApprovalBanner(): boolean {
    return this.commonService.isAwaitingOrganizationApproval();
  }

  exitDemoMode(): void {
    this.demoModeService.setDemoMode(false, { animate: true });
  }
}
