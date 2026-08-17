import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserModel } from '../login-page/model/user-model';
import { DASHBOARD_NAV_ROUTES } from '../dashboard/dashboard-routes.config';
import {
  ChatApiService,
  ChatAskResult,
  ChatCitation,
  ChatConversation,
  ChatMessage,
  ChatReasoning,
  ChatStreamEvent,
} from 'src/app/services/api-service/chat-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import {
  AI_MODE_COMMANDS,
  AI_MODE_SUGGESTIONS,
  AiModeCommandItem,
  AiModeGalleryTab,
  AiModeSuggestion,
} from './data/ai-mode.data';
import {
  AiChatCitation,
  AiChatMessage,
  AiChatReasoning,
  AiChatThread,
  createMessageId,
  formatCitationLabel,
  formatCitationTitle,
  formatReasoningHitLabel,
  titleFromPrompt,
} from './data/ai-mode-history';

export type AiModeAttachment = {
  id: string;
  file: File;
  name: string;
  sizeLabel: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

@Component({
  selector: 'app-ai-mode',
  standalone: true,
  imports: [CommonModule, FormsModule, NgTemplateOutlet],
  templateUrl: './ai-mode.component.html',
  styleUrl: './ai-mode.component.scss',
})
export class AiModeComponent implements OnInit, OnDestroy {
  readonly suggestions: AiModeSuggestion[] = AI_MODE_SUGGESTIONS;
  readonly commands: AiModeCommandItem[] = AI_MODE_COMMANDS;
  readonly galleryTabs: { id: AiModeGalleryTab; label: string }[] = [
    { id: 'suggested', label: 'Suggested' },
    { id: 'recent', label: 'Recently asked' },
    { id: 'starred', label: 'Starred' },
  ];
  readonly formatCitationLabel = formatCitationLabel;
  readonly formatCitationTitle = formatCitationTitle;
  readonly formatReasoningHitLabel = formatReasoningHitLabel;
  readonly libraryRoute = DASHBOARD_NAV_ROUTES.library;

  query = '';
  commandSearch = '';
  historySearch = '';
  loginedUserInfo: UserModel = {} as UserModel;
  menuOpen = false;
  attachPanelOpen = false;
  historyOpen = false;
  /** Local-only chips; MVP `/chat` does not accept file uploads (use Library for RAG). */
  attachments: AiModeAttachment[] = [];
  activeGalleryTab: AiModeGalleryTab = 'suggested';
  starredIds = new Set<string>(['study-methods']);
  recentIds: string[] = [];
  threads: AiChatThread[] = [];
  activeThreadId: string | null = null;
  isSending = false;
  loadingHistory = false;
  loadingThread = false;

  isListening = false;
  speechSupported = false;
  interimTranscript = '';
  committedTranscript = '';
  voiceError = '';
  audioLevel = 0;

  @ViewChild('promptInput') promptInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('composerRoot') composerRoot?: ElementRef<HTMLElement>;
  @ViewChild('threadScroll') threadScroll?: ElementRef<HTMLElement>;

  private recognition: BrowserSpeechRecognition | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelRaf = 0;
  private streamAbort: AbortController | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    public commonService: CommonService,
    private chatApi: ChatApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.speechSupported = this.createRecognition() != null;
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.streamAbort?.abort();
    this.stopListening(true);
  }

  get isOrganizationAccount(): boolean {
    return (
      sessionStorage.getItem('loginType') === 'organization' ||
      this.loginedUserInfo.role === 'organization'
    );
  }

  get userDisplayName(): string {
    const info = this.loginedUserInfo;
    if (this.isOrganizationAccount) {
      return info.name?.trim() || sessionStorage.getItem('activeOrganizationName')?.trim() || 'there';
    }

    const first = (info.firstName || info.first_name || '').trim();
    const last = (info.lastName || info.last_name || '').trim();
    const fullName = [first, last].filter(Boolean).join(' ');
    return fullName || first || 'there';
  }

  get greetingName(): string {
    return this.userDisplayName.split(' ')[0] || this.userDisplayName;
  }

  get filteredCommands(): AiModeCommandItem[] {
    const q = this.commandSearch.trim().toLowerCase();
    if (!q) {
      return this.commands;
    }
    return this.commands.filter((item) => item.label.toLowerCase().includes(q));
  }

  get galleryItems(): AiModeSuggestion[] {
    if (this.activeGalleryTab === 'starred') {
      return this.suggestions.filter((item) => this.starredIds.has(item.id));
    }
    if (this.activeGalleryTab === 'recent') {
      return this.recentIds
        .map((id) => this.suggestions.find((item) => item.id === id))
        .filter((item): item is AiModeSuggestion => !!item);
    }
    return this.suggestions;
  }

  get voiceStatusLabel(): string {
    if (!this.speechSupported) {
      return 'Voice unavailable';
    }
    if (this.voiceError) {
      return this.voiceError;
    }
    if (this.isListening) {
      return this.interimTranscript ? 'Listening…' : 'Speak now';
    }
    return '';
  }

  get activeThread(): AiChatThread | null {
    if (!this.activeThreadId) {
      return null;
    }
    return this.threads.find((thread) => thread.id === this.activeThreadId) ?? null;
  }

  get filteredThreads(): AiChatThread[] {
    const q = this.historySearch.trim().toLowerCase();
    const sorted = [...this.threads].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    if (!q) {
      return sorted;
    }
    return sorted.filter((thread) => {
      if (thread.title.toLowerCase().includes(q)) {
        return true;
      }
      return thread.messages.some((msg) => msg.content.toLowerCase().includes(q));
    });
  }

  get showHome(): boolean {
    return !this.activeThread;
  }

  get visibleMessages(): AiChatMessage[] {
    return (this.activeThread?.messages ?? []).filter((msg) => msg.role !== 'system');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen && !this.attachPanelOpen) {
      return;
    }
    const root = this.composerRoot?.nativeElement;
    if (root && !root.contains(event.target as Node)) {
      this.menuOpen = false;
      this.attachPanelOpen = false;
    }
  }

  focusInput(): void {
    this.promptInput?.nativeElement.focus();
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
    this.attachPanelOpen = false;
    if (this.menuOpen) {
      this.commandSearch = '';
    }
  }

  onCommand(item: AiModeCommandItem, event?: Event): void {
    event?.stopPropagation();
    if (item.action === 'attach') {
      this.menuOpen = false;
      this.attachPanelOpen = true;
      return;
    }
    if (item.prompt) {
      this.query = item.prompt;
      this.focusInput();
    }
    this.menuOpen = false;
  }

  goToLibrary(event?: Event): void {
    event?.stopPropagation();
    this.attachPanelOpen = false;
    this.menuOpen = false;
    void this.router.navigate([this.libraryRoute]);
  }

  removeAttachment(id: string, event?: Event): void {
    event?.stopPropagation();
    this.attachments = this.attachments.filter((item) => item.id !== id);
  }

  clearPrompt(event?: Event): void {
    event?.stopPropagation();
    this.query = '';
    this.focusInput();
  }

  setGalleryTab(tab: AiModeGalleryTab): void {
    this.activeGalleryTab = tab;
  }

  toggleStar(suggestion: AiModeSuggestion, event: Event): void {
    event.stopPropagation();
    if (this.starredIds.has(suggestion.id)) {
      this.starredIds.delete(suggestion.id);
    } else {
      this.starredIds.add(suggestion.id);
    }
    this.starredIds = new Set(this.starredIds);
  }

  isStarred(id: string): boolean {
    return this.starredIds.has(id);
  }

  applySuggestion(suggestion: AiModeSuggestion): void {
    this.query = suggestion.text;
    this.recentIds = [suggestion.id, ...this.recentIds.filter((id) => id !== suggestion.id)].slice(0, 8);
    this.focusInput();
  }

  toggleHistory(): void {
    this.historyOpen = !this.historyOpen;
    if (this.historyOpen && !this.threads.length && !this.loadingHistory) {
      this.loadConversations();
    }
  }

  startNewChat(): void {
    this.activeThreadId = null;
    this.query = '';
    this.attachments = [];
    this.focusInput();
  }

  openThread(threadId: string): void {
    this.activeThreadId = threadId;
    this.query = '';
    this.attachments = [];
    const thread = this.threads.find((item) => item.id === threadId);
    if (thread && !thread.messagesLoaded) {
      this.loadConversationDetail(threadId);
    } else {
      queueMicrotask(() => this.scrollThreadToBottom());
    }
  }

  deleteThread(threadId: string, event: Event): void {
    event.stopPropagation();
    this.chatApi
      .deleteConversation(threadId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.threads = this.threads.filter((thread) => thread.id !== threadId);
          if (this.activeThreadId === threadId) {
            this.activeThreadId = null;
          }
        },
        error: (err) => this.toastError(err, 'Could not delete conversation'),
      });
  }

  threadPreview(thread: AiChatThread): string {
    const firstUser = thread.messages.find((msg) => msg.role === 'user');
    return firstUser?.content?.trim() || thread.title;
  }

  formatThreadTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  formatMessage(content: string): string {
    return content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/_(.*?)_/g, '$1');
  }

  submitPrompt(): void {
    const trimmed = this.query.trim();
    if (!trimmed || this.isSending) {
      this.focusInput();
      return;
    }

    const promptText = trimmed;
    const now = new Date().toISOString();
    const userMessage: AiChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: promptText,
      createdAt: now,
    };
    const pendingAssistant: AiChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: '',
      createdAt: now,
      pending: true,
      streaming: true,
      thinkingVisible: true,
      streamStatus: 'Searching your library…',
    };

    let thread = this.activeThread;
    if (!thread) {
      thread = {
        id: `pending-${Date.now()}`,
        title: titleFromPrompt(promptText),
        updatedAt: now,
        messages: [],
        messagesLoaded: true,
      };
      this.threads = [thread, ...this.threads];
      this.activeThreadId = thread.id;
    }

    thread.messages = [...thread.messages, userMessage, pendingAssistant];
    thread.updatedAt = now;
    if (thread.messages.filter((msg) => msg.role === 'user').length === 1) {
      thread.title = titleFromPrompt(promptText);
    }
    this.threads = this.threads.map((item) => (item.id === thread!.id ? { ...thread! } : item));

    this.query = '';
    this.attachments = [];
    this.historyOpen = true;
    this.isSending = true;
    queueMicrotask(() => this.scrollThreadToBottom());

    const conversationId = thread.id.startsWith('pending-') ? undefined : thread.id;
    this.streamAbort?.abort();
    this.streamAbort = new AbortController();
    const pendingId = pendingAssistant.id;
    const draft = { text: '', modelThinking: '' };

    this.chatApi
      .askStream(
        {
          question: promptText,
          conversation_id: conversationId,
        },
        this.streamAbort.signal
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => this.onStreamEvent(thread!, pendingId, promptText, event, draft),
        error: (err) => {
          this.isSending = false;
          if (!draft.text) {
            thread!.messages = thread!.messages.filter((msg) => msg.id !== pendingId);
          } else {
            this.patchAssistant(thread!, pendingId, {
              pending: false,
              streaming: false,
              streamStatus: undefined,
              content: draft.text,
            });
          }
          this.threads = this.threads.map((item) => (item.id === thread!.id ? { ...thread! } : item));
          this.toastError(err, 'Could not get an answer');
        },
        complete: () => {
          this.isSending = false;
        },
      });
  }

  private onStreamEvent(
    thread: AiChatThread,
    pendingId: string,
    promptText: string,
    event: ChatStreamEvent,
    draft: { text: string; modelThinking: string }
  ): void {
    if (event.type === 'status') {
      this.patchAssistant(thread, pendingId, {
        pending: !draft.text,
        streaming: true,
        thinkingVisible: !draft.text,
        streamStatus: event.phase === 'generating' ? 'Thinking…' : 'Searching your library…',
      });
      queueMicrotask(() => this.scrollThreadToBottom());
      return;
    }
    if (event.type === 'reasoning') {
      if (event.phase === 'model' && event.modelText) {
        draft.modelThinking += event.modelText;
        this.patchAssistant(thread, pendingId, {
          pending: !draft.text,
          streaming: true,
          thinkingVisible: !draft.text,
          modelThinking: draft.modelThinking,
          streamStatus: 'Thinking…',
        });
      } else {
        this.patchAssistant(thread, pendingId, {
          pending: !draft.text,
          streaming: true,
          thinkingVisible: !draft.text,
          reasoning: this.mapReasoning(event.reasoning),
          streamStatus: event.reasoning?.summary ? undefined : 'Searching your library…',
          ...(event.citations.length ? { citations: this.mapCitations(event.citations) } : {}),
        });
      }
      queueMicrotask(() => this.scrollThreadToBottom());
      return;
    }
    if (event.type === 'token') {
      draft.text += event.text;
      this.patchAssistant(thread, pendingId, {
        pending: false,
        streaming: true,
        thinkingVisible: false,
        modelThinking: undefined,
        streamStatus: undefined,
        content: draft.text,
      });
      queueMicrotask(() => this.scrollThreadToBottom());
      return;
    }
    if (event.type === 'error') {
      this.isSending = false;
      if (!draft.text) {
        thread.messages = thread.messages.filter((msg) => msg.id !== pendingId);
        this.threads = this.threads.map((item) => (item.id === thread.id ? { ...thread } : item));
      } else {
        this.patchAssistant(thread, pendingId, {
          pending: false,
          streaming: false,
          streamStatus: undefined,
          content: draft.text,
        });
      }
      this.toastError({ message: event.message }, event.message || 'Could not get an answer');
      return;
    }
    if (event.type === 'done') {
      this.isSending = false;
      this.applyDoneResult(thread, pendingId, promptText, event.result, draft.text);
    }
  }

  private applyDoneResult(
    thread: AiChatThread,
    pendingId: string,
    promptText: string,
    result: ChatAskResult,
    streamedText: string
  ): void {
    const mapped = result.message ? this.mapApiMessage(result.message) : null;
    const assistantMessage: AiChatMessage = {
      id: mapped?.id || pendingId,
      role: 'assistant',
      content: mapped?.content || result.answer || streamedText || 'No answer returned.',
      createdAt: mapped?.createdAt || new Date().toISOString(),
      citations: mapped?.citations || this.mapCitations(result.citations),
      reasoning: mapped?.reasoning || this.mapReasoning(result.reasoning),
      pending: false,
      streaming: false,
      thinkingVisible: false,
      modelThinking: undefined,
      streamStatus: undefined,
    };

    const previousId = thread.id;
    const nextId = result.conversation_id || previousId;
    thread.id = nextId;
    thread.messagesLoaded = true;
    thread.updatedAt = assistantMessage.createdAt;
    thread.messages = thread.messages
      .filter((msg) => msg.id !== pendingId)
      .concat(assistantMessage);
    if (!thread.title || thread.title === 'New chat') {
      thread.title = titleFromPrompt(promptText);
    }

    this.threads = this.threads.map((item) =>
      item.id === previousId || item.id === nextId ? { ...thread } : item
    );
    this.activeThreadId = nextId;
    queueMicrotask(() => this.scrollThreadToBottom());
  }

  private patchAssistant(thread: AiChatThread, messageId: string, patch: Partial<AiChatMessage>): void {
    thread.messages = thread.messages.map((msg) => (msg.id === messageId ? { ...msg, ...patch } : msg));
    this.threads = this.threads.map((item) => (item.id === thread.id ? { ...thread } : item));
  }

  onPromptKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitPrompt();
    }
  }

  async toggleListening(event?: Event): Promise<void> {
    event?.stopPropagation();
    if (!this.speechSupported) {
      this.voiceError = 'Use Chrome or Edge for voice input';
      return;
    }
    if (this.isListening) {
      this.stopListening();
      return;
    }
    await this.startListening();
  }

  private loadConversations(): void {
    this.loadingHistory = true;
    this.chatApi
      .listConversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.loadingHistory = false;
          const mapped = rows.map((row) => this.mapConversationSummary(row));
          const active = this.activeThread;
          if (active?.id.startsWith('pending-')) {
            this.threads = [active, ...mapped.filter((item) => item.id !== active.id)];
          } else {
            this.threads = mapped.map((item) => {
              const existing = this.threads.find((t) => t.id === item.id);
              return existing?.messagesLoaded
                ? { ...item, messages: existing.messages, messagesLoaded: true }
                : item;
            });
          }
        },
        error: (err) => {
          this.loadingHistory = false;
          this.toastError(err, 'Could not load chat history');
        },
      });
  }

  private loadConversationDetail(threadId: string): void {
    this.loadingThread = true;
    this.chatApi
      .getConversation(threadId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.loadingThread = false;
          const messages = detail.messages
            .map((msg) => this.mapApiMessage(msg))
            .filter((msg) => msg.role !== 'system');
          const updatedAt =
            detail.conversation.updated_at ||
            detail.conversation.created_at ||
            messages[messages.length - 1]?.createdAt ||
            new Date().toISOString();
          const title =
            detail.conversation.title ||
            titleFromPrompt(messages.find((m) => m.role === 'user')?.content || 'Conversation');

          this.threads = this.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  title,
                  updatedAt,
                  messages,
                  messagesLoaded: true,
                }
              : thread
          );
          queueMicrotask(() => this.scrollThreadToBottom());
        },
        error: (err) => {
          this.loadingThread = false;
          this.toastError(err, 'Could not load conversation');
        },
      });
  }

  private mapConversationSummary(row: ChatConversation): AiChatThread {
    const updatedAt = row.updated_at || row.created_at || new Date().toISOString();
    return {
      id: row.id,
      title: row.title || 'Conversation',
      updatedAt,
      messages: [],
      messagesLoaded: false,
    };
  }

  private mapApiMessage(msg: ChatMessage): AiChatMessage {
    return {
      id: msg.id || createMessageId(),
      role:
        msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system'
          ? msg.role
          : 'assistant',
      content: msg.content || '',
      createdAt: msg.created_at || new Date().toISOString(),
      citations: this.mapCitations(msg.citations),
      reasoning: this.mapReasoning(msg.reasoning),
    };
  }

  private mapReasoning(raw?: ChatReasoning | null): AiChatReasoning | undefined {
    if (!raw) {
      return undefined;
    }
    const summary = (raw.summary || '').trim();
    const steps = Array.isArray(raw.steps)
      ? raw.steps.filter((step) => typeof step === 'string' && !!step.trim())
      : [];
    const retrieval = Array.isArray(raw.retrieval)
      ? raw.retrieval
          .map((hit) => ({
            file: (hit.file || 'Source').trim() || 'Source',
            page: hit.page ?? null,
            score: typeof hit.score === 'number' ? hit.score : null,
            snippet: hit.snippet?.trim() || null,
          }))
          .filter((hit) => !!hit.file)
      : [];
    if (!summary && !steps.length && !retrieval.length) {
      return undefined;
    }
    return { summary, steps, retrieval };
  }

  private mapCitations(citations?: ChatCitation[] | null): AiChatCitation[] | undefined {
    if (!Array.isArray(citations) || !citations.length) {
      return undefined;
    }
    const mapped = citations
      .map((raw) => {
        const c = raw as ChatCitation & {
          fileName?: string;
          file_name?: string;
          fileId?: string;
          page_number?: number;
          pageNumber?: number;
        };
        const file = (c.file || c.fileName || c.file_name || '').toString().trim();
        const page =
          typeof c.page === 'number'
            ? c.page
            : typeof c.page_number === 'number'
              ? c.page_number
              : typeof c.pageNumber === 'number'
                ? c.pageNumber
                : undefined;
        const fileId = (c.file_id || c.fileId || '').toString().trim() || undefined;
        if (!file && !fileId) {
          return null;
        }
        return {
          file: file || 'Source',
          page,
          fileId,
        } as AiChatCitation;
      })
      .filter((c): c is AiChatCitation => !!c);
    return mapped.length ? mapped : undefined;
  }

  private toastError(err: unknown, fallback: string): void {
    const message =
      (err as { message?: string; msg?: string })?.message ||
      (err as { msg?: string })?.msg ||
      fallback;
    this.commonService.openToaster({
      message: typeof message === 'string' ? message : fallback,
      messageType: TOASTER_MESSAGE_TYPE.ERROR,
    });
  }

  private async startListening(): Promise<void> {
    this.voiceError = '';
    const recognition = this.createRecognition();
    if (!recognition) {
      this.speechSupported = false;
      this.voiceError = 'Speech recognition unavailable';
      return;
    }

    this.recognition = recognition;
    this.committedTranscript = '';
    this.interimTranscript = '';

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      this.isListening = true;
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalChunk += text;
        } else {
          interim += text;
        }
      }
      if (finalChunk.trim()) {
        this.committedTranscript = `${this.committedTranscript} ${finalChunk}`.trim();
        this.appendToQuery(finalChunk.trim());
      }
      this.interimTranscript = interim.trim();
    };

    recognition.onerror = (event) => {
      const code = event.error || 'error';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        this.voiceError = 'Microphone permission denied';
      } else if (code === 'no-speech') {
        this.voiceError = 'No speech detected';
      } else if (code !== 'aborted') {
        this.voiceError = `Voice error: ${code}`;
      }
      this.stopListening();
    };

    recognition.onend = () => {
      this.isListening = false;
      this.stopAudioMeter();
    };

    try {
      await this.startAudioMeter();
      recognition.start();
      this.isListening = true;
    } catch {
      this.voiceError = 'Could not start microphone';
      this.stopListening(true);
    }
  }

  private stopListening(abort = false): void {
    const recognition = this.recognition;
    this.recognition = null;
    this.isListening = false;
    this.stopAudioMeter();

    if (!recognition) {
      return;
    }
    try {
      if (abort) {
        recognition.abort();
      } else {
        recognition.stop();
      }
    } catch {
      // ignore
    }
  }

  private appendToQuery(text: string): void {
    if (!text) {
      return;
    }
    this.query = this.query.trim() ? `${this.query.trim()} ${text}` : text;
  }

  private async startAudioMeter(): Promise<void> {
    this.stopAudioMeter();
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      const data = new Uint8Array(this.analyser.frequencyBinCount);

      const tick = () => {
        if (!this.analyser) {
          return;
        }
        this.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        this.audioLevel = Math.min(1, rms * 4);
        this.levelRaf = requestAnimationFrame(tick);
      };
      this.levelRaf = requestAnimationFrame(tick);
    } catch {
      this.audioLevel = 0;
    }
  }

  private stopAudioMeter(): void {
    if (this.levelRaf) {
      cancelAnimationFrame(this.levelRaf);
      this.levelRaf = 0;
    }
    this.audioLevel = 0;
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
  }

  private createRecognition(): BrowserSpeechRecognition | null {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => BrowserSpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => BrowserSpeechRecognition })
        .webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      return null;
    }
    return new SpeechRecognitionCtor();
  }

  private scrollThreadToBottom(): void {
    const attempt = (remaining: number) => {
      const scroller = this.threadScroll?.nativeElement;
      if (scroller) {
        scroller.scrollTop = scroller.scrollHeight;
        if (remaining > 0) {
          requestAnimationFrame(() => attempt(remaining - 1));
        }
        return;
      }
      if (remaining > 0) {
        setTimeout(() => attempt(remaining - 1), 32);
      }
    };

    queueMicrotask(() => attempt(8));
  }
}
