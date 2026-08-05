export type PricingBillingCycle = 'monthly' | 'annually';

export type PricingPlanId = 'starter' | 'pro' | 'organization';

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  tagline: string;
  badge?: string;
  featured?: boolean;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  ctaLabel: string;
  ctaTone: 'primary' | 'secondary' | 'ghost';
  features: string[];
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Get started with core learning tools.',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: '£',
    ctaLabel: 'Get started free',
    ctaTone: 'ghost',
    features: [
      'Access enrolled courses',
      'Basic progress tracking',
      'Community study prompts',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Unlock AI tutoring and advanced study tools.',
    badge: 'Most popular',
    featured: true,
    monthlyPrice: 9.99,
    annualPrice: 99,
    currency: '£',
    ctaLabel: 'Upgrade to Pro',
    ctaTone: 'primary',
    features: [
      'Everything in Starter',
      'AI Mode tutoring sessions',
      'Personalized study plans',
      'Weak-topic diagnostics',
      'Priority support',
    ],
  },
  {
    id: 'organization',
    name: 'Organization',
    tagline: 'For schools, coaching centers, and teams.',
    monthlyPrice: 49,
    annualPrice: 490,
    currency: '£',
    ctaLabel: 'Contact sales',
    ctaTone: 'secondary',
    features: [
      'Everything in Pro',
      'Teacher & student directory',
      'Approval workflows',
      'Org branding & themes',
      'Admin analytics',
      'Dedicated onboarding',
    ],
  },
];

export const PRICING_TRIAL = {
  days: 7,
  title: 'Try Pro free for 7 days',
  description:
    'Explore AI tutoring, study plans, and diagnostics with no charge for a week. Cancel anytime before the trial ends.',
  ctaLabel: 'Start 7-day free trial',
  notes: [
    'No payment required to start',
    'Full Pro features during the trial',
    'Reminder before your trial ends',
  ],
} as const;
