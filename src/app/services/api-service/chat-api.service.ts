import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonService } from 'src/app/shared/services/common.service';
import { resolveSessionRole, type AppSessionRole } from 'src/app/shared/utils/session-role.util';
import { environment } from 'src/environments/environment';

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export type ChatCitation = {
  file: string;
  page?: number;
  file_id?: string;
};

export type ChatReasoningHit = {
  file: string;
  page?: number | null;
  file_id?: string | null;
  score?: number | null;
  snippet?: string | null;
};

export type ChatReasoning = {
  summary: string;
  steps: string[];
  retrieval: ChatReasoningHit[];
};

type LooseCitation = {
  file?: string;
  fileName?: string;
  file_name?: string;
  page?: number;
  page_number?: number;
  pageNumber?: number;
  file_id?: string;
  fileId?: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: ChatMessageRole;
  content: string;
  citations?: ChatCitation[];
  reasoning?: ChatReasoning | null;
  created_at: string;
};

export type ChatConversation = {
  id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  organization_id?: string;
};

export type ChatAskRequest = {
  question: string;
  conversation_id?: string;
  /** Session login type — required by Logic. */
  role?: AppSessionRole;
};

export type ChatAskResult = {
  conversation_id: string;
  answer: string;
  citations: ChatCitation[];
  reasoning?: ChatReasoning | null;
  message?: ChatMessage;
};

export type ChatConversationDetail = {
  conversation: ChatConversation;
  messages: ChatMessage[];
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private readonly apiUrl = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  ask(payload: ChatAskRequest): Observable<ChatAskResult> {
    const role = payload.role || this.resolveCallerRole();
    const body: ChatAskRequest = {
      question: payload.question,
      role,
      ...(payload.conversation_id ? { conversation_id: payload.conversation_id } : {}),
    };

    return this.http
      .post<ApiEnvelope<ChatAskResult> | ChatAskResult>(`${this.apiUrl}chat`, body)
      .pipe(
        map((res) => this.unwrapAsk(res)),
        catchError(this.commonService.handleError)
      );
  }

  listConversations(): Observable<ChatConversation[]> {
    const role = this.resolveCallerRole();
    return this.http
      .get<ApiEnvelope<ChatConversation[]> | ChatConversation[]>(
        `${this.apiUrl}chat/conversations`,
        { params: { role } }
      )
      .pipe(
        map((res) => this.asArray<ChatConversation>(res)),
        catchError(this.commonService.handleError)
      );
  }

  getConversation(id: string): Observable<ChatConversationDetail> {
    const role = this.resolveCallerRole();
    return this.http
      .get<
        | ApiEnvelope<ChatConversationDetail>
        | ChatConversationDetail
        | { conversation: ChatConversation; messages: ChatMessage[] }
      >(`${this.apiUrl}chat/conversations/${encodeURIComponent(id)}`, {
        params: { role },
      })
      .pipe(
        map((res) => this.unwrapConversationDetail(res)),
        catchError(this.commonService.handleError)
      );
  }

  deleteConversation(id: string): Observable<void> {
    const role = this.resolveCallerRole();
    return this.http
      .delete(`${this.apiUrl}chat/conversations/${encodeURIComponent(id)}`, {
        params: { role },
      })
      .pipe(
        map(() => void 0),
        catchError(this.commonService.handleError)
      );
  }

  private resolveCallerRole(): AppSessionRole {
    const info = this.commonService.loginedUserInfo;
    return resolveSessionRole(info?.role, sessionStorage.getItem('loginType'));
  }

  private unwrapAsk(res: ApiEnvelope<ChatAskResult> | ChatAskResult): ChatAskResult {
    const data = this.unwrapData(res);
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid chat response');
    }

    const row = data as ChatAskResult & {
      conversationId?: string;
      metadata?: { reasoning?: unknown };
    };
    const reasoning = this.normalizeReasoning(
      row.reasoning ?? row.message?.reasoning ?? row.metadata?.reasoning
    );
    const message = row.message
      ? {
          ...row.message,
          citations: this.normalizeCitations(row.message.citations),
          reasoning: this.normalizeReasoning(row.message.reasoning ?? reasoning),
        }
      : undefined;
    return {
      conversation_id: row.conversation_id || row.conversationId || row.message?.conversation_id || '',
      answer: row.answer || row.message?.content || '',
      citations: this.normalizeCitations(
        Array.isArray(row.citations)
          ? row.citations
          : Array.isArray(row.message?.citations)
            ? row.message!.citations!
            : []
      ),
      reasoning: message?.reasoning ?? reasoning,
      message,
    };
  }

  private normalizeCitations(citations?: LooseCitation[] | ChatCitation[] | null): ChatCitation[] {
    if (!Array.isArray(citations) || !citations.length) {
      return [];
    }
    return citations
      .map((raw) => {
        const c = raw as LooseCitation;
        const file = (c.file || c.fileName || c.file_name || '').toString().trim();
        const page =
          typeof c.page === 'number'
            ? c.page
            : typeof c.page_number === 'number'
              ? c.page_number
              : typeof c.pageNumber === 'number'
                ? c.pageNumber
                : undefined;
        const file_id = (c.file_id || c.fileId || '').toString().trim() || undefined;
        if (!file && !file_id) {
          return null;
        }
        return {
          file: file || 'Source',
          ...(page !== undefined ? { page } : {}),
          ...(file_id ? { file_id } : {}),
        } as ChatCitation;
      })
      .filter((c): c is ChatCitation => !!c);
  }

  private unwrapConversationDetail(
    res:
      | ApiEnvelope<ChatConversationDetail>
      | ChatConversationDetail
      | { conversation: ChatConversation; messages: ChatMessage[] }
  ): ChatConversationDetail {
    const data = this.unwrapData(res) as ChatConversationDetail | undefined;
    if (!data?.conversation) {
      throw new Error('Invalid conversation response');
    }
    return {
      conversation: data.conversation,
      messages: Array.isArray(data.messages)
        ? data.messages.map((msg) => this.normalizeMessage(msg))
        : [],
    };
  }

  private normalizeMessage(msg: ChatMessage & { metadata?: { reasoning?: unknown } }): ChatMessage {
    return {
      ...msg,
      citations: this.normalizeCitations(msg.citations),
      reasoning: this.normalizeReasoning(msg.reasoning ?? msg.metadata?.reasoning),
    };
  }

  private normalizeReasoning(raw: unknown): ChatReasoning | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const row = raw as {
      summary?: unknown;
      steps?: unknown;
      retrieval?: unknown;
    };
    const summary = typeof row.summary === 'string' ? row.summary.trim() : '';
    const steps = Array.isArray(row.steps)
      ? row.steps.filter((step): step is string => typeof step === 'string' && !!step.trim())
      : [];
    const retrieval = Array.isArray(row.retrieval)
      ? row.retrieval
          .map((hit) => this.normalizeReasoningHit(hit))
          .filter((hit): hit is ChatReasoningHit => !!hit)
      : [];
    if (!summary && !steps.length && !retrieval.length) {
      return null;
    }
    return { summary, steps, retrieval };
  }

  private normalizeReasoningHit(raw: unknown): ChatReasoningHit | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const hit = raw as ChatReasoningHit & LooseCitation & { snippet?: string | null; score?: number | null };
    const file = (hit.file || hit.fileName || hit.file_name || '').toString().trim();
    const page =
      typeof hit.page === 'number'
        ? hit.page
        : typeof hit.page_number === 'number'
          ? hit.page_number
          : typeof hit.pageNumber === 'number'
            ? hit.pageNumber
            : null;
    const file_id = (hit.file_id || hit.fileId || '').toString().trim() || null;
    const score = typeof hit.score === 'number' && Number.isFinite(hit.score) ? hit.score : null;
    const snippet = typeof hit.snippet === 'string' && hit.snippet.trim() ? hit.snippet.trim() : null;
    if (!file && !file_id) {
      return null;
    }
    return {
      file: file || 'Source',
      page,
      file_id,
      score,
      snippet,
    };
  }

  private unwrapData<T>(res: ApiEnvelope<T> | T): T {
    if (res && typeof res === 'object' && 'data' in (res as object)) {
      return ((res as ApiEnvelope<T>).data ?? res) as T;
    }
    return res as T;
  }

  private asArray<T>(res: ApiEnvelope<T[]> | T[]): T[] {
    const data = this.unwrapData(res);
    return Array.isArray(data) ? data : [];
  }
}
