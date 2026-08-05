import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { DASHBOARD_NAV_ROUTES } from '../dashboard/dashboard-routes.config';
import {
  PRICING_PLANS,
  PRICING_TRIAL,
  PricingBillingCycle,
  PricingPlan,
} from './data/pricing.data';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.scss',
})
export class PricingPageComponent {
  readonly plans = PRICING_PLANS;
  readonly trial = PRICING_TRIAL;
  billingCycle: PricingBillingCycle = 'monthly';

  constructor(
    private router: Router,
    private commonService: CommonService
  ) {}

  setBillingCycle(cycle: PricingBillingCycle): void {
    this.billingCycle = cycle;
  }

  priceLabel(plan: PricingPlan): string {
    if (plan.monthlyPrice === 0 && plan.annualPrice === 0) {
      return `${plan.currency}0`;
    }
    const amount =
      this.billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    const formatted =
      amount % 1 === 0 ? String(amount) : amount.toFixed(2);
    return `${plan.currency}${formatted}`;
  }

  periodLabel(plan: PricingPlan): string {
    if (plan.monthlyPrice === 0 && plan.annualPrice === 0) {
      return 'forever';
    }
    return this.billingCycle === 'monthly' ? '/ month' : '/ year';
  }

  annualSavingsLabel(plan: PricingPlan): string | null {
    if (this.billingCycle !== 'annually' || plan.monthlyPrice <= 0) {
      return null;
    }
    const monthlyCost = plan.monthlyPrice * 12;
    const saved = Math.round(((monthlyCost - plan.annualPrice) / monthlyCost) * 100);
    return saved > 0 ? `Save ${saved}%` : null;
  }

  onSelectPlan(plan: PricingPlan): void {
    if (plan.id === 'starter') {
      void this.router.navigate([DASHBOARD_NAV_ROUTES.courses]);
      return;
    }
    if (plan.id === 'organization') {
      this.commonService.openToaster({
        message: 'Thanks — our team will follow up about Organization plans.',
        messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
      });
      return;
    }
    this.startTrial();
  }

  startTrial(): void {
    this.commonService.openToaster({
      message: `Your ${this.trial.days}-day Pro trial is ready to begin.`,
      messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
    });
    void this.router.navigate([DASHBOARD_NAV_ROUTES.aiMode]);
  }
}
