import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppContextService } from 'src/app/core/app-context.service';
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

export type ChatStreamStatusPhase = 'retrieving' | 'generating';

export type ChatStreamEvent =
  | { type: 'status'; phase: ChatStreamStatusPhase }
  | { type: 'reasoning'; reasoning: ChatReasoning | null; citations: ChatCitation[] }
  | { type: 'token'; text: string }
  | { type: 'done'; result: ChatAskResult }
  | { type: 'error'; message: string; code?: string };

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
    private commonService: CommonService,
    private appContext: AppContextService
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

  /**
   * Logic SSE proxy. Falls back to POST /chat when the stream route is missing.
   * Uses fetch (EventSource is GET-only).
   */
  askStream(payload: ChatAskRequest, signal?: AbortSignal): Observable<ChatStreamEvent> {
    const role = payload.role || this.resolveCallerRole();
    const body: ChatAskRequest = {
      question: payload.question,
      role,
      ...(payload.conversation_id ? { conversation_id: payload.conversation_id } : {}),
    };

    return new Observable<ChatStreamEvent>((subscriber) => {
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      if (signal) {
        if (signal.aborted) {
          controller.abort();
        } else {
          signal.addEventListener('abort', onAbort);
        }
      }

      const run = async () => {
        try {
          const streamed = await this.readChatStream(body, controller.signal, (event) =>
            subscriber.next(event)
          );
          if (!streamed) {
            const result = await lastValueFrom(this.ask(body));
            subscriber.next({ type: 'done', result });
          }
          subscriber.complete();
        } catch (err) {
          if (controller.signal.aborted || (err as { name?: string })?.name === 'AbortError') {
            subscriber.complete();
            return;
          }
          subscriber.error(err);
        }
      };

      void run();

      return () => {
        signal?.removeEventListener('abort', onAbort);
        controller.abort();
      };
    });
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

  /** @returns false when caller should fall back to JSON POST /chat */
  private async readChatStream(
    body: ChatAskRequest,
    signal: AbortSignal,
    emit: (event: ChatStreamEvent) => void
  ): Promise<boolean> {
    const token = sessionStorage.getItem('authToken');
    const appId = this.appContext.getAppIdSync();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (appId) {
      headers['x-app-id'] = appId;
      headers['app_id'] = appId;
    }

    let res: Response;
    try {
      res = await fetch(`${this.apiUrl}chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      });
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') {
        throw err;
      }
      throw err;
    }

    if (res.status === 404 || res.status === 501 || res.status === 405) {
      return false;
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
      const message = await this.readHttpError(res);
      throw new Error(message);
    }

    if (!res.body || !contentType.includes('text/event-stream')) {
      if (contentType.includes('application/json')) {
        const json = await res.json();
        emit({ type: 'done', result: this.unwrapAsk(json) });
        return true;
      }
      return false;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let sawDone = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop() ?? '';
      for (const block of parts) {
        const parsed = this.parseSseBlock(block);
        if (!parsed) {
          continue;
        }
        const event = this.mapSseEvent(parsed.event, parsed.data);
        if (!event) {
          continue;
        }
        emit(event);
        if (event.type === 'done' || event.type === 'error') {
          sawDone = true;
        }
      }
    }

    if (buf.trim()) {
      const parsed = this.parseSseBlock(buf);
      if (parsed) {
        const event = this.mapSseEvent(parsed.event, parsed.data);
        if (event) {
          emit(event);
          if (event.type === 'done' || event.type === 'error') {
            sawDone = true;
          }
        }
      }
    }

    if (!sawDone) {
      emit({ type: 'error', message: 'The answer stream ended unexpectedly.' });
    }
    return true;
  }

  private parseSseBlock(block: string): { event: string; data: unknown } | null {
    const lines = block.split('\n');
    let event = '';
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    if (!event || !dataLines.length) {
      return null;
    }
    const raw = dataLines.join('\n');
    try {
      return { event, data: JSON.parse(raw) };
    } catch {
      return { event, data: raw };
    }
  }

  private mapSseEvent(event: string, data: unknown): ChatStreamEvent | null {
    const row = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    if (event === 'status') {
      const phase = row['phase'] === 'generating' ? 'generating' : 'retrieving';
      return { type: 'status', phase };
    }
    if (event === 'token') {
      const text = typeof row['text'] === 'string' ? row['text'] : '';
      return text ? { type: 'token', text } : null;
    }
    if (event === 'reasoning') {
      const citations = this.normalizeCitations(
        (row['citations'] as LooseCitation[] | undefined) ?? null
      );
      return {
        type: 'reasoning',
        reasoning: this.normalizeReasoning(row['reasoning'] ?? row),
        citations,
      };
    }
    if (event === 'done') {
      return { type: 'done', result: this.unwrapAsk(data as ChatAskResult) };
    }
    if (event === 'error') {
      const message =
        (typeof row['message'] === 'string' && row['message']) ||
        'Could not generate an answer.';
      const code = typeof row['code'] === 'string' ? row['code'] : undefined;
      return { type: 'error', message, code };
    }
    return null;
  }

  private async readHttpError(res: Response): Promise<string> {
    try {
      const json = await res.json();
      const msg =
        json?.message ||
        json?.msg ||
        json?.error ||
        json?.data?.message;
      if (typeof msg === 'string' && msg.trim()) {
        return msg;
      }
    } catch {
      // ignore
    }
    return `Chat stream failed (${res.status})`;
  }
}
