export type AiChatRole = 'user' | 'assistant';

export type AiChatMessage = {
  id: string;
  role: AiChatRole;
  content: string;
  createdAt: string;
  attachmentNames?: string[];
};

export type AiChatThread = {
  id: string;
  title: string;
  updatedAt: string;
  messages: AiChatMessage[];
};

export const AI_MODE_HISTORY_KEY = 'mw-ai-mode-history-v1';

export function createMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createThreadId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function titleFromPrompt(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return 'New chat';
  }
  return cleaned.length > 48 ? `${cleaned.slice(0, 48)}…` : cleaned;
}

/** Temporary reply until the AI tutor backend is wired. */
export function buildPlaceholderReply(prompt: string, files: string[]): string {
  const fileNote = files.length
    ? `\n\nI can see you attached: ${files.join(', ')}. Once the tutor API is connected, I’ll use those files in my answer.`
    : '';

  return [
    `Here’s a starting point for your question:`,
    ``,
    `**You asked:** ${prompt}`,
    ``,
    `1. Clarify the goal — what outcome do you want from this study session?`,
    `2. Break it into smaller steps you can finish today.`,
    `3. Check your recent course activity for related lessons or assessments.`,
    `4. Ask a follow-up if you want a quiz, summary, or study plan next.`,
    fileNote,
    ``,
    `_PetaxAI tutor responses will appear here when the backend is connected._`,
  ].join('\n');
}
