export type AiChatRole = 'user' | 'assistant' | 'system';

export type AiChatCitation = {
  file: string;
  page?: number;
  fileId?: string;
};

export type AiChatMessage = {
  id: string;
  role: AiChatRole;
  content: string;
  createdAt: string;
  attachmentNames?: string[];
  citations?: AiChatCitation[];
  pending?: boolean;
};

export type AiChatThread = {
  id: string;
  title: string;
  updatedAt: string;
  messages: AiChatMessage[];
  messagesLoaded?: boolean;
};

export function createMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function titleFromPrompt(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return 'New chat';
  }
  return cleaned.length > 48 ? `${cleaned.slice(0, 48)}…` : cleaned;
}

export function formatCitationLabel(citation: AiChatCitation): string {
  if (citation.page != null && citation.page !== undefined) {
    return `${citation.file} · p.${citation.page}`;
  }
  return citation.file;
}
