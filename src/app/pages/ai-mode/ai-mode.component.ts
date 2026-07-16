import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserModel } from '../login-page/model/user-model';
import { CommonService } from 'src/app/shared/services/common.service';
import { AI_MODE_SUGGESTIONS, AiModeSuggestion } from './data/ai-mode.data';

@Component({
  selector: 'app-ai-mode',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-mode.component.html',
  styleUrl: './ai-mode.component.scss',
})
export class AiModeComponent implements OnInit {
  readonly suggestions: AiModeSuggestion[] = AI_MODE_SUGGESTIONS;

  query = '';
  loginedUserInfo: UserModel = {} as UserModel;

  @ViewChild('promptInput') promptInput?: ElementRef<HTMLTextAreaElement>;

  constructor(public commonService: CommonService) {}

  ngOnInit(): void {
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
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

  focusInput(): void {
    this.promptInput?.nativeElement.focus();
  }

  applySuggestion(suggestion: AiModeSuggestion): void {
    this.query = suggestion.text;
    this.focusInput();
  }

  submitPrompt(): void {
    const trimmed = this.query.trim();
    if (!trimmed) {
      this.focusInput();
      return;
    }

    // Placeholder until AI backend is wired.
    console.info('[AI Mode] prompt submitted:', trimmed);
  }

  onPromptKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitPrompt();
    }
  }
}
