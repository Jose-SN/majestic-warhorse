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
      title: 'Real-Time',
      variant: 'bar-chart',
      headerRight: 'Real Time',
      headerRightAccent: true,
      bars: [38, 42, 45, 48, 52, 55, 58, 62, 65, 68, 72, 76, 82, 88],
    },
    {
      id: 'students-rings',
      title: 'Total Students',
      variant: 'dual-rings',
      headerRight: '0',
      rings: [
        { value: 69, color: '#00f2ff', style: 'progress' },
        { value: 0, style: 'concentric' },
      ],
    },
    {
      id: 'students-mixed',
      title: 'Total Students',
      variant: 'ring-bars',
      headerRight: '0',
      ringValue: 90,
      ringColor: '#ffc258',
      miniBars: [38, 52, 44, 68, 48, 62, 42, 58],
    },
    {
      id: 'real-goals',
      title: 'Real Goals',
      variant: 'goal-rings',
      headerRight: '0',
      rings: [
        { value: 60, color: '#ffc258', style: 'progress' },
        { value: 40, style: 'concentric' },
      ],
    },
  ],
  recommendations: [
    {
      id: 'rec-1',
      title: 'Military Strategy Course',
      subtitle: 'Advanced tactical planning',
      coverStyle: 'linear-gradient(160deg, #1e4a6e 0%, #0a1628 45%, #2a1848 100%)',
    },
    {
      id: 'rec-2',
      title: 'Military Strategy Course',
      subtitle: 'Leadership under pressure',
      coverStyle: 'linear-gradient(160deg, #4a2818 0%, #1a0f08 40%, #3d2817 100%)',
    },
    {
      id: 'rec-3',
      title: 'Military Strategy Course',
      subtitle: 'Operational excellence',
      coverStyle: 'linear-gradient(160deg, #123456 0%, #061525 45%, #1e1040 100%)',
    },
    {
      id: 'rec-4',
      title: 'Military Strategy Course',
      subtitle: 'Team coordination',
      coverStyle: 'linear-gradient(160deg, #1c3e1a 0%, #0a1508 45%, #2a1f10 100%)',
    },{
      id: 'rec-3',
      title: 'Military Strategy Course',
      subtitle: 'Operational excellence',
      coverStyle: 'linear-gradient(160deg, #123456 0%, #061525 45%, #1e1040 100%)',
    },
    {
      id: 'rec-4',
      title: 'Military Strategy Course',
      subtitle: 'Team coordination',
      coverStyle: 'linear-gradient(160deg, #1c3e1a 0%, #0a1508 45%, #2a1f10 100%)',
    },{
      id: 'rec-3',
      title: 'Military Strategy Course',
      subtitle: 'Operational excellence',
      coverStyle: 'linear-gradient(160deg, #123456 0%, #061525 45%, #1e1040 100%)',
    },
    {
      id: 'rec-4',
      title: 'Military Strategy Course',
      subtitle: 'Team coordination',
      coverStyle: 'linear-gradient(160deg, #1c3e1a 0%, #0a1508 45%, #2a1f10 100%)',
    },
  ],
  subscribedCourses: [
    {
      id: 'sub-1',
      title: 'Demo Course 1',
      featured: true,
      coverStyle: 'linear-gradient(135deg, #1a3a5c 0%, #0d1f33 50%, #2d1b4e 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '4/8',
      completePercent: 68,
      ringColor: '#00f2ff',
      nextSessionValue: '1/10',
    },
    {
      id: 'sub-2',
      title: 'Demo Course 1',
      categoryLabel: 'Invite',
      categoryTitle: 'Soouse 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #4a2a5c 0%, #2a1a44 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '6/13',
      completePercent: 68,
      ringColor: '#00ff85',
      nextSessionValue: '0/13',
    },
    {
      id: 'sub-3',
      title: 'Demo Course 1',
      categoryLabel: 'A Course by',
      categoryTitle: 'Military Strateg 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #3a5a6b 0%, #1a3444 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '3/35',
      completePercent: 68,
      ringColor: '#00f2ff',
      nextSessionValue: '1:00',
    },
    {
      id: 'sub-4',
      title: 'Demo Course 1',
      categoryLabel: 'A Course by',
      categoryTitle: 'Military Strateg 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #5a4a3b 0%, #3a2a1b 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '4/8',
      completePercent: 68,
      ringColor: '#ffc258',
      nextSessionValue: '1/10',
    },
    {
      id: 'sub-5',
      title: 'Demo Course 1',
      categoryLabel: 'Invite',
      categoryTitle: 'Soouse 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #3a4a6b 0%, #1a2744 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '6/13',
      completePercent: 68,
      ringColor: '#00f2ff',
      nextSessionValue: '0/13',
    },
    {
      id: 'sub-6',
      title: 'Demo Course 1',
      categoryLabel: 'A Course by',
      categoryTitle: 'Military Strateg 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #4a3a6b 0%, #2a1a44 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '3/35',
      completePercent: 68,
      ringColor: '#00ff85',
      nextSessionValue: '1:00',
    },
    {
      id: 'sub-7',
      title: 'Demo Course 1',
      categoryLabel: 'A Course by',
      categoryTitle: 'Military Strateg 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #3a5a6b 0%, #1a3444 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '4/8',
      completePercent: 68,
      ringColor: '#ffc258',
      nextSessionValue: '1/10',
    },
    {
      id: 'sub-8',
      title: 'Demo Course 1',
      categoryLabel: 'Invite',
      categoryTitle: 'Soouse 1',
      usePlaceholderIcon: true,
      coverStyle: 'linear-gradient(135deg, #5a4a3b 0%, #3a2a1b 100%)',
      filledStars: 4,
      ratingStars: 3,
      progressFraction: '6/13',
      completePercent: 68,
      ringColor: '#00f2ff',
      nextSessionValue: '0/13',
    },
  ],
  insights: {
    hologramLabel: 'AI-generated Hologram',
    hologramEmail: 'majesticwarhorse.ui@gmail.com',
    activityFeed: [
      { title: 'Recent course completion', subtitle: 'Recent Course & Goals' },
      { title: 'Recent course completion', subtitle: 'Recent Course & Goals' },
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
