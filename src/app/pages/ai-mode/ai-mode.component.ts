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
import { UserModel } from '../login-page/model/user-model';
import { CommonService } from 'src/app/shared/services/common.service';
import {
  AI_MODE_COMMANDS,
  AI_MODE_SUGGESTIONS,
  AiModeCommandItem,
  AiModeGalleryTab,
  AiModeSuggestion,
} from './data/ai-mode.data';
import {
  AI_MODE_HISTORY_KEY,
  AiChatMessage,
  AiChatThread,
  buildPlaceholderReply,
  createMessageId,
  createThreadId,
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

  query = '';
  commandSearch = '';
  historySearch = '';
  loginedUserInfo: UserModel = {} as UserModel;
  menuOpen = false;
  attachPanelOpen = false;
  historyOpen = false;
  attachments: AiModeAttachment[] = [];
  activeGalleryTab: AiModeGalleryTab = 'suggested';
  starredIds = new Set<string>(['study-methods']);
  recentIds: string[] = [];
  threads: AiChatThread[] = [];
  activeThreadId: string | null = null;

  isListening = false;
  speechSupported = false;
  interimTranscript = '';
  committedTranscript = '';
  voiceError = '';
  audioLevel = 0;

  @ViewChild('promptInput') promptInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('composerRoot') composerRoot?: ElementRef<HTMLElement>;
  @ViewChild('threadScroll') threadScroll?: ElementRef<HTMLElement>;

  private recognition: BrowserSpeechRecognition | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelRaf = 0;

  constructor(public commonService: CommonService) {}

  ngOnInit(): void {
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.speechSupported = this.createRecognition() != null;
    this.threads = this.loadHistory();
  }

  ngOnDestroy(): void {
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

  openFilePicker(event?: Event): void {
    event?.stopPropagation();
    this.fileInput?.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) {
      return;
    }

    const next = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      name: file.name,
      sizeLabel: this.formatFileSize(file.size),
    }));
    this.attachments = [...this.attachments, ...next];
    input.value = '';
    this.attachPanelOpen = true;
    this.menuOpen = false;
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
    queueMicrotask(() => this.scrollThreadToBottom());
  }

  deleteThread(threadId: string, event: Event): void {
    event.stopPropagation();
    this.threads = this.threads.filter((thread) => thread.id !== threadId);
    if (this.activeThreadId === threadId) {
      this.activeThreadId = null;
    }
    this.persistHistory();
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
    const fileNames = this.attachments.map((item) => item.name);
    if (!trimmed && !fileNames.length) {
      this.focusInput();
      return;
    }

    const promptText = trimmed || `Attached: ${fileNames.join(', ')}`;
    const now = new Date().toISOString();
    const userMessage: AiChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: promptText,
      createdAt: now,
      attachmentNames: fileNames.length ? fileNames : undefined,
    };
    const assistantMessage: AiChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: buildPlaceholderReply(promptText, fileNames),
      createdAt: now,
    };

    let thread = this.activeThread;
    if (!thread) {
      thread = {
        id: createThreadId(),
        title: titleFromPrompt(promptText),
        updatedAt: now,
        messages: [],
      };
      this.threads = [thread, ...this.threads];
      this.activeThreadId = thread.id;
    }

    thread.messages = [...thread.messages, userMessage, assistantMessage];
    thread.updatedAt = now;
    if (thread.messages.filter((msg) => msg.role === 'user').length === 1) {
      thread.title = titleFromPrompt(promptText);
    }

    this.threads = this.threads.map((item) => (item.id === thread!.id ? { ...thread! } : item));
    this.persistHistory();
    this.query = '';
    this.attachments = [];
    this.historyOpen = true;
    queueMicrotask(() => this.scrollThreadToBottom());
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

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private loadHistory(): AiChatThread[] {
    try {
      const raw = localStorage.getItem(AI_MODE_HISTORY_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as AiChatThread[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistHistory(): void {
    try {
      localStorage.setItem(AI_MODE_HISTORY_KEY, JSON.stringify(this.threads.slice(0, 50)));
    } catch {
      // ignore quota / private mode
    }
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
