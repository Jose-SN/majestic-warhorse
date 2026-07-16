export interface AiModeSuggestion {
  id: string;
  text: string;
}

export const AI_MODE_SUGGESTIONS: AiModeSuggestion[] = [
  {
    id: 'course-recommendations',
    text: 'Recommend courses based on my learning progress',
  },
  {
    id: 'study-methods',
    text: 'What are the best study techniques for my enrolled courses?',
  },
  {
    id: 'activity-summary',
    text: 'Summarize my recent course activity and next steps',
  },
];
