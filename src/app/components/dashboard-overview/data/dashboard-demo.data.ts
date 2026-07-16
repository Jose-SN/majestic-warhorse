/**
 * Dashboard demo view model — swap `DASHBOARD_DEMO_DATA` for API mapping later.
 * Wire live data in `DashboardOverviewComponent.mergeLiveData()`.
 */

export type StatWidgetVariant = 'bar-chart' | 'dual-rings' | 'ring-bars' | 'goal-rings';
export type StatRingStyle = 'progress' | 'concentric';

export interface DashboardStatWidget {
  id: string;
  title: string;
  variant: StatWidgetVariant;
  headerRight?: string;
  headerRightAccent?: boolean;
  bars?: number[];
  rings?: Array<{ value: number; color?: string; style?: StatRingStyle }>;
  ringValue?: number;
  ringColor?: string;
  miniBars?: number[];
}

export interface RecommendedCourseItem {
  id: string;
  title: string;
  subtitle: string;
  coverStyle: string;
  imageUrl?: string;
  ctaLabel?: string;
}

export interface SubscribedCourseItem {
  id: string;
  title: string;
  categoryLabel?: string;
  categoryTitle?: string;
  coverStyle: string;
  imageUrl?: string;
  featured?: boolean;
  usePlaceholderIcon?: boolean;
  filledStars: number;
  /** Filled stars in the 5-star rating row (reference: first star gold). */
  ratingStars: number;
  progressFraction: string;
  completePercent: number;
  ringColor: string;
  nextSessionValue: string;
}

export interface ActivityFeedItem {
  title: string;
  subtitle: string;
}

export interface DailyGoalItem {
  icon: 'trophy' | 'check';
  title: string;
  subtitle: string;
  percent: number;
}

export interface DashboardInsightsData {
  hologramLabel: string;
  hologramEmail: string;
  activityFeed: ActivityFeedItem[];
  badgeTitle: string;
  badgeStars: number;
  dailyGoals: DailyGoalItem[];
  analyticsSubtitle: string;
  weekProgress: number[];
  suggestedProgress: number[];
}

export interface DashboardDemoViewModel {
  filterTabs: string[];
  statWidgets: DashboardStatWidget[];
  recommendations: RecommendedCourseItem[];
  subscribedCourses: SubscribedCourseItem[];
  insights: DashboardInsightsData;
}

export const DASHBOARD_DEMO_DATA: DashboardDemoViewModel = {
  filterTabs: ['All', 'New', 'Pending', 'Completed'],
  statWidgets: [
    {
      id: 'real-time',
      title: 'Real-Time Activity',
      variant: 'bar-chart',
      headerRight: 'LIVE HUD',
      headerRightAccent: true,
      bars: [30, 50, 80, 65, 40, 90, 55, 100, 45],
    },
    {
      id: 'students-rings',
      title: 'Total Students',
      variant: 'dual-rings',
      headerRight: '0',
      rings: [
        { value: 69, color: '#ff6b2c', style: 'progress' },
        { value: 0, style: 'concentric' },
      ],
    },
    {
      id: 'students-mixed',
      title: 'Enrollment',
      variant: 'ring-bars',
      headerRight: '0',
      ringValue: 90,
      ringColor: '#ff6b2c',
      miniBars: [38, 52, 44, 68, 48, 62, 42, 58],
    },
    {
      id: 'real-goals',
      title: 'Real Goals',
      variant: 'goal-rings',
      headerRight: '0',
      rings: [
        { value: 60, color: '#ffb59a', style: 'progress' },
        { value: 40, style: 'concentric' },
      ],
    },
  ],
  recommendations: [
    {
      id: 'rec-1',
      title: 'Military Strategy Course',
      subtitle: 'Advanced tactical planning',
      ctaLabel: 'Join Mission',
      coverStyle: 'linear-gradient(160deg, #1e4a6e 0%, #0a1628 45%, #2a1848 100%)',
    },
    {
      id: 'rec-2',
      title: 'Cybernetic Biology',
      subtitle: 'Neural systems & bio-interfaces',
      ctaLabel: 'Enter Lab',
      coverStyle: 'linear-gradient(160deg, #4a2818 0%, #1a0f08 40%, #3d2817 100%)',
    },
    {
      id: 'rec-3',
      title: 'Military Strategy 3',
      subtitle: 'Operational excellence',
      coverStyle: 'linear-gradient(160deg, #123456 0%, #061525 45%, #1e1040 100%)',
    },
    {
      id: 'rec-4',
      title: 'Military Strategy 4',
      subtitle: 'Team coordination',
      coverStyle: 'linear-gradient(160deg, #1c3e1a 0%, #0a1508 45%, #2a1f10 100%)',
    },{
      id: 'rec-5',
      title: 'Military Strategy 5',
      subtitle: 'Operational excellence',
      coverStyle: 'linear-gradient(160deg, #123456 0%, #061525 45%, #1e1040 100%)',
    },
    {
      id: 'rec-6',
      title: 'Military Strategy 6',
      subtitle: 'Team coordination',
      coverStyle: 'linear-gradient(160deg, #1c3e1a 0%, #0a1508 45%, #2a1f10 100%)',
    },{
      id: 'rec-7',
      title: 'Military Strategy 7',
      subtitle: 'Operational excellence',
      coverStyle: 'linear-gradient(160deg, #123456 0%, #061525 45%, #1e1040 100%)',
    },
    {
      id: 'rec-8',
      title: 'Military Strategy 8',
      subtitle: 'Team coordination',
      coverStyle: 'linear-gradient(160deg, #1c3e1a 0%, #0a1508 45%, #2a1f10 100%)',
    },
    {
      id: 'rec-9',
      title: 'Military Strategy 9',
      subtitle: 'Operational excellence',
      coverStyle: 'linear-gradient(160deg, #123456 0%, #061525 45%, #1e1040 100%)',
    },
    {
      id: 'rec-10',
      title: 'Military Strategy 10',
      subtitle: 'Team coordination',
      coverStyle: 'linear-gradient(160deg, #1c3e1a 0%, #0a1508 45%, #2a1f10 100%)',
    },{
      id: 'rec-11',
      title: 'Military Strategy 11',
      subtitle: 'Operational excellence',
      coverStyle: 'linear-gradient(160deg, #123456 0%, #061525 45%, #1e1040 100%)',
    },
    {
      id: 'rec-12',
      title: 'Military Strategy 12',
      subtitle: 'Team coordination',
      coverStyle: 'linear-gradient(160deg, #1c3e1a 0%, #0a1508 45%, #2a1f10 100%)',
    },
  ],
  subscribedCourses: [
    {
      id: 'sub-1',
      title: 'Tactical Systems v1.0',
      featured: true,
      coverStyle: 'linear-gradient(135deg, #1a3a5c 0%, #0d1f33 50%, #2d1b4e 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '4/8 Progress',
      completePercent: 68,
      ringColor: '#ff6b2c',
      nextSessionValue: '1/18',
    },
    {
      id: 'sub-2',
      title: 'Strategic Soundscapes',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #4a2a5c 0%, #2a1a44 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '6/13 Progress',
      completePercent: 30,
      ringColor: '#ab0063',
      nextSessionValue: '0/13',
    },
    {
      id: 'sub-3',
      title: 'Data Architecture',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #3a5a6b 0%, #1a3444 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '3/35 Progress',
      completePercent: 85,
      ringColor: '#bb7bff',
      nextSessionValue: '1:00',
    },
    {
      id: 'sub-4',
      title: 'Neural Interfacing',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #5a4a3b 0%, #3a2a1b 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '4/8 Progress',
      completePercent: 10,
      ringColor: '#ff6b2c',
      nextSessionValue: '1/10',
    },
    {
      id: 'sub-5',
      title: 'Demo Course 5',
      categoryLabel: 'Invite',
      categoryTitle: 'Soouse 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #3a4a6b 0%, #1a2744 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '6/13',
      completePercent: 68,
      ringColor: '#ab0063',
      nextSessionValue: '0/13',
    },
    {
      id: 'sub-6',
      title: 'Demo Course 6',
      categoryLabel: 'A Course by',
      categoryTitle: 'Military Strateg 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #4a3a6b 0%, #2a1a44 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '3/35',
      completePercent: 68,
      ringColor: '#bb7bff',
      nextSessionValue: '1:00',
    },
    {
      id: 'sub-7',
      title: 'Demo Course 7',
      categoryLabel: 'A Course by',
      categoryTitle: 'Military Strateg 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #3a5a6b 0%, #1a3444 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '4/8',
      completePercent: 68,
      ringColor: '#ff6b2c',
      nextSessionValue: '1/10',
    },
    {
      id: 'sub-8',
      title: 'Demo Course 8',
      categoryLabel: 'Invite',
      categoryTitle: 'Soouse 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #5a4a3b 0%, #3a2a1b 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '6/13',
      completePercent: 68,
      ringColor: '#ab0063',
      nextSessionValue: '0/13',
    },
    {
      id: 'sub-9',
      title: 'Demo Course 9',
      featured: true,
      coverStyle: 'linear-gradient(135deg, #1a3a5c 0%, #0d1f33 50%, #2d1b4e 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '4/8',
      completePercent: 68,
      ringColor: '#ff6b2c',
      nextSessionValue: '1/10',
    },
    {
      id: 'sub-10',
      title: 'Demo Course 10',
      categoryLabel: 'Invite',
      categoryTitle: 'Soouse 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #4a2a5c 0%, #2a1a44 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '6/13',
      completePercent: 68,
      ringColor: '#ab0063',
      nextSessionValue: '0/13',
    },
    {
      id: 'sub-11',
      title: 'Demo Course 11',
      categoryLabel: 'A Course by',
      categoryTitle: 'Military Strateg 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #3a5a6b 0%, #1a3444 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '3/35',
      completePercent: 68,
      ringColor: '#bb7bff',
      nextSessionValue: '1:00',
    },
    {
      id: 'sub-12',
      title: 'Demo Course 12',
      categoryLabel: 'A Course by',
      categoryTitle: 'Military Strateg 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #5a4a3b 0%, #3a2a1b 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '4/8',
      completePercent: 68,
      ringColor: '#ff6b2c',
      nextSessionValue: '1/10',
    },
    {
      id: 'sub-13',
      title: 'Demo Course 13',
      categoryLabel: 'Invite',
      categoryTitle: 'Soouse 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #3a4a6b 0%, #1a2744 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '6/13',
      completePercent: 68,
      ringColor: '#ab0063',
      nextSessionValue: '0/13',
    },
    {
      id: 'sub-14',
      title: 'Demo Course 14',
      categoryLabel: 'A Course by',
      categoryTitle: 'Military Strateg 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #4a3a6b 0%, #2a1a44 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '3/35',
      completePercent: 68,
      ringColor: '#bb7bff',
      nextSessionValue: '1:00',
    },
    {
      id: 'sub-15',
      title: 'Demo Course 15',
      categoryLabel: 'A Course by',
      categoryTitle: 'Military Strateg 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #3a5a6b 0%, #1a3444 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '4/8',
      completePercent: 68,
      ringColor: '#ff6b2c',
      nextSessionValue: '1/10',
    },
    {
      id: 'sub-16',
      title: 'Demo Course 16',
      categoryLabel: 'Invite',
      categoryTitle: 'Soouse 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #5a4a3b 0%, #3a2a1b 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '6/13',
      completePercent: 68,
      ringColor: '#ab0063',
      nextSessionValue: '0/13',
    },
  ],
  insights: {
    hologramLabel: 'AI-GENERATED HOLOGRAM',
    hologramEmail: 'dzine.jose@gmail.com',
    activityFeed: [
      { title: 'Course completion', subtitle: 'Recent Course & Goals' },
      { title: 'New badge earned', subtitle: 'Recent Course & Goals' },
    ],
    badgeTitle: 'AI-Suggested',
    badgeStars: 5,
    dailyGoals: [
      { icon: 'trophy', title: 'AI-Time Awards', subtitle: 'Range over week', percent: 90 },
      { icon: 'check', title: 'AI-Suggested Daily Goals', subtitle: 'Rules over week', percent: 80 },
    ],
    analyticsSubtitle: 'Week-over-week progress',
    weekProgress: [35, 48, 42, 58, 65, 72, 78],
    suggestedProgress: [43, 40, 50, 52, 59, 66, 70],
  },
};

export function createEmptyStatWidgets(): DashboardStatWidget[] {
  return [
    {
      id: 'real-time',
      title: 'Real-Time Activity',
      variant: 'bar-chart',
      headerRight: 'LIVE HUD',
      headerRightAccent: true,
      bars: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      id: 'students-rings',
      title: 'Total Students',
      variant: 'dual-rings',
      headerRight: '0',
      rings: [
        { value: 0, color: '#ff6b2c', style: 'progress' },
        { value: 0, style: 'concentric' },
      ],
    },
    {
      id: 'students-mixed',
      title: 'Enrollment',
      variant: 'ring-bars',
      headerRight: '0',
      ringValue: 0,
      ringColor: '#ff6b2c',
      miniBars: [0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      id: 'real-goals',
      title: 'Real Goals',
      variant: 'goal-rings',
      headerRight: '0',
      rings: [
        { value: 0, color: '#ffb59a', style: 'progress' },
        { value: 0, style: 'concentric' },
      ],
    },
  ];
}

export function createEmptyDashboardViewModel(): DashboardDemoViewModel {
  return {
    filterTabs: ['All', 'New', 'Pending', 'Completed'],
    statWidgets: createEmptyStatWidgets(),
    recommendations: [],
    subscribedCourses: [],
    insights: {
      hologramLabel: '',
      hologramEmail: '',
      activityFeed: [],
      badgeTitle: '',
      badgeStars: 0,
      dailyGoals: [],
      analyticsSubtitle: '',
      weekProgress: [],
      suggestedProgress: [],
    },
  };
}
