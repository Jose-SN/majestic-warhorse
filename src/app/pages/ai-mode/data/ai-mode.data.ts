export interface AiModeSuggestion {
  id: string;
  text: string;
  title: string;
  badge: string;
  tone: 'orange' | 'gold' | 'blue' | 'rose';
  icon: string;
}

export type AiModeGalleryTab = 'suggested' | 'recent' | 'starred';

export interface AiModeCommandItem {
  id: string;
  label: string;
  icon: string;
  action: 'attach' | 'prompt';
  prompt?: string;
}

export const AI_MODE_COMMANDS: AiModeCommandItem[] = [
  { id: 'attach', label: 'Library', icon: 'folder_open', action: 'attach' },
  {
    id: 'courses',
    label: 'Courses',
    icon: 'menu_book',
    action: 'prompt',
    prompt: 'Recommend courses based on my learning progress',
  },
  {
    id: 'study',
    label: 'Study plan',
    icon: 'calendar_month',
    action: 'prompt',
    prompt: 'Build a study plan for my enrolled courses this week',
  },
  {
    id: 'assess',
    label: 'Assessments',
    icon: 'quiz',
    action: 'prompt',
    prompt: 'Help me prepare for upcoming assessments',
  },
];

export const AI_MODE_SUGGESTIONS: AiModeSuggestion[] = [
  {
    id: 'course-recommendations',
    title: 'Course match',
    text: 'Recommend courses based on my learning progress',
    badge: 'Suggested',
    tone: 'orange',
    icon: 'auto_awesome',
  },
  {
    id: 'study-methods',
    title: 'Study techniques',
    text: 'What are the best study techniques for my enrolled courses?',
    badge: 'Study',
    tone: 'gold',
    icon: 'lightbulb',
  },
  {
    id: 'activity-summary',
    title: 'Activity summary',
    text: 'Summarize my recent course activity and next steps',
    badge: 'Progress',
    tone: 'blue',
    icon: 'insights',
  },
  {
    id: 'exam-prep',
    title: 'Exam prep',
    text: 'Create a short quiz from my weakest topics',
    badge: 'Practice',
    tone: 'rose',
    icon: 'school',
  },
];
