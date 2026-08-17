export type AiChatRole = 'user' | 'assistant' | 'system';

export type AiChatCitation = {
  file: string;
  page?: number;
  fileId?: string;
};

export type AiChatReasoningHit = {
  file: string;
  page?: number | null;
  score?: number | null;
  snippet?: string | null;
};

export type AiChatReasoning = {
  summary: string;
  steps: string[];
  retrieval: AiChatReasoningHit[];
};

export type AiChatMessage = {
  id: string;
  role: AiChatRole;
  content: string;
  createdAt: string;
  attachmentNames?: string[];
  citations?: AiChatCitation[];
  reasoning?: AiChatReasoning | null;
  /** Live model-phase reasoning text (hidden once answer tokens arrive). */
  modelThinking?: string;
  /** Show the pre-answer thinking panel (retrieval + model reasoning). */
  thinkingVisible?: boolean;
  pending?: boolean;
  streaming?: boolean;
  streamStatus?: string;
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
  const name = (citation.file || 'Source').trim() || 'Source';
  if (citation.page != null && citation.page !== undefined) {
    return `${name} · p.${citation.page}`;
  }
  return name;
}

/** Full citation tooltip: file, page, and file_id when present. */
export function formatCitationTitle(citation: AiChatCitation): string {
  const parts = [formatCitationLabel(citation)];
  if (citation.fileId) {
    parts.push(`file_id: ${citation.fileId}`);
  }
  return parts.join(' · ');
}

export function formatReasoningHitLabel(hit: AiChatReasoningHit): string {
  const name = (hit.file || 'Source').trim() || 'Source';
  const parts = [name];
  if (hit.page != null) {
    parts.push(`p.${hit.page}`);
  }
  if (typeof hit.score === 'number') {
    const score = hit.score <= 1 ? Math.round(hit.score * 100) : Math.round(hit.score);
    parts.push(`${score}%`);
  }
  return parts.join(' · ');
}
