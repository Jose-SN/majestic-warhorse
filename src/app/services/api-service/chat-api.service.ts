import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export type ChatCitation = {
  file: string;
  page?: number;
  file_id?: string;
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
};

export type ChatAskResult = {
  conversation_id: string;
  answer: string;
  citations: ChatCitation[];
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
    const body: ChatAskRequest = {
      question: payload.question,
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
    return this.http
      .get<ApiEnvelope<ChatConversation[]> | ChatConversation[]>(`${this.apiUrl}chat/conversations`)
      .pipe(
        map((res) => this.asArray<ChatConversation>(res)),
        catchError(this.commonService.handleError)
      );
  }

  getConversation(id: string): Observable<ChatConversationDetail> {
    return this.http
      .get<
        | ApiEnvelope<ChatConversationDetail>
        | ChatConversationDetail
        | { conversation: ChatConversation; messages: ChatMessage[] }
      >(`${this.apiUrl}chat/conversations/${encodeURIComponent(id)}`)
      .pipe(
        map((res) => this.unwrapConversationDetail(res)),
        catchError(this.commonService.handleError)
      );
  }

  deleteConversation(id: string): Observable<void> {
    return this.http
      .delete(`${this.apiUrl}chat/conversations/${encodeURIComponent(id)}`)
      .pipe(
        map(() => void 0),
        catchError(this.commonService.handleError)
      );
  }

  private unwrapAsk(res: ApiEnvelope<ChatAskResult> | ChatAskResult): ChatAskResult {
    const data = this.unwrapData(res);
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid chat response');
    }

    const row = data as ChatAskResult & { conversationId?: string };
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
      message: row.message
        ? {
            ...row.message,
            citations: this.normalizeCitations(row.message.citations),
          }
        : undefined,
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
      messages: Array.isArray(data.messages) ? data.messages : [],
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
