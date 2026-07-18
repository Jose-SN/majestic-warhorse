import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { QuestionnaireApiService } from 'src/app/services/api-service/questionnaire-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ConfirmationPopupService } from 'src/app/shared/confirmation-popup/confirmation-popup.service';

export interface AnswerSubmission {
  id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  submittedAt?: string;
  answers: { [key: string]: string | string[] };
  questions?: any[];
  feedback?: string;
  correctedAnswers?: { [key: string]: string | string[] };
}

@Component({
  selector: 'app-assessment-answers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assessment-answers.component.html',
  styleUrl: './assessment-answers.component.scss',
})
export class AssessmentAnswersComponent implements OnInit, OnChanges, OnDestroy {
  @Input() courseId: string = '';
  private destroy$ = new Subject<void>();
  public submissions: AnswerSubmission[] = [];
  public questionsList: any[] = [];
  public loading = false;
  public questionsLoading = false;
  public questionsLoadError = false;
  public submissionsLoadError = false;
  public feedbackMap: { [submissionId: string]: string } = {};
  public canAccess = false;
  public selectedSubmission: AnswerSubmission | null = null;
  public selectedGrade: 'FAIL' | 'PASS' | 'DIST' = 'PASS';
  readonly gradeOptions: Array<'FAIL' | 'PASS' | 'DIST'> = ['FAIL', 'PASS', 'DIST'];

  get isContentLoading(): boolean {
    return this.loading || this.questionsLoading;
  }

  constructor(
    private questionnaireApiService: QuestionnaireApiService,
    public commonService: CommonService,
    private confirmationPopupService: ConfirmationPopupService
  ) {}

  get activeFeedback(): string {
    if (!this.selectedSubmission) {
      return '';
    }
    return this.feedbackMap[this.submissionKey(this.selectedSubmission)] ?? '';
  }

  set activeFeedback(value: string) {
    if (!this.selectedSubmission) {
      return;
    }
    this.feedbackMap[this.submissionKey(this.selectedSubmission)] = value;
  }

  ngOnInit(): void {
    this.canAccess = this.commonService.adminRoleType.includes(
      this.commonService?.loginedUserInfo?.role ?? ''
    );
    if (!this.canAccess) return;

    this.loadQuestions();
    this.loadSubmissions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.canAccess) return;
    if (changes['courseId'] && !changes['courseId'].firstChange) {
      this.loadQuestions();
      this.loadSubmissions();
    }
  }

  selectSubmission(submission: AnswerSubmission): void {
    this.selectedSubmission = submission;
    const key = this.submissionKey(submission);
    const stored = submission.feedback ?? this.feedbackMap[key] ?? '';
    const gradeMatch = stored.match(/^\s*\[(FAIL|PASS|DIST)\]\s*/i);
    if (gradeMatch) {
      this.selectedGrade = gradeMatch[1].toUpperCase() as 'FAIL' | 'PASS' | 'DIST';
    } else {
      this.selectedGrade = 'PASS';
    }
    this.feedbackMap[key] = stored.replace(/^\s*\[(FAIL|PASS|DIST)\]\s*/i, '');
  }

  isSelected(submission: AnswerSubmission): boolean {
    return this.submissionKey(submission) === this.submissionKey(this.selectedSubmission);
  }

  submissionKey(submission: AnswerSubmission | null | undefined): string {
    if (!submission) {
      return '';
    }
    return String(submission.id ?? submission.userId ?? '');
  }

  shortCadetId(submission: AnswerSubmission): string {
    const raw = this.submissionKey(submission) || '0000';
    return `CADET_${raw.slice(-4).toUpperCase()}`;
  }

  cadetInitials(submission: AnswerSubmission): string {
    const name = (submission.userName || '').trim();
    if (!name) {
      return '??';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  answeredCount(submission: AnswerSubmission): number {
    return Object.keys(submission.answers || {}).length;
  }

  hasAnswer(value: string | string[] | undefined): boolean {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return String(value ?? '').trim().length > 0;
  }

  isTextAnswer(question: any): boolean {
    const type = String(question?.type || '').toLowerCase();
    return type === 'text' || type === 'textbox' || type === 'textarea';
  }

  getQuestionTypeLabel(type?: string): string {
    const map: Record<string, string> = {
      text: 'Text Response',
      textbox: 'Text Response',
      textarea: 'Long Form',
      radio: 'Multiple Choice',
      checkbox: 'Multi Select',
      dropdown: 'Dropdown',
    };
    return map[String(type || '').toLowerCase()] || String(type || 'Response');
  }

  loadQuestions(): void {
    const courseId = this.courseId?.trim();
    if (!courseId) {
      this.questionsList = [];
      this.questionsLoading = false;
      this.questionsLoadError = false;
      return;
    }

    this.questionsLoading = true;
    this.questionsLoadError = false;
    this.questionnaireApiService
      .getQuestionsByCourse(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.questionsList = questions || [];
          this.questionsLoading = false;
        },
        error: (err) => {
          console.error('Error loading questions:', err);
          this.questionsList = [];
          this.questionsLoading = false;
          this.questionsLoadError = true;
        },
      });
  }

  loadSubmissions(): void {
    const courseId = this.courseId?.trim() ?? '';
    if (!courseId) {
      this.loading = false;
      this.submissionsLoadError = false;
      this.submissions = [];
      this.selectedSubmission = null;
      return;
    }
    this.loading = true;
    this.submissionsLoadError = false;
    this.questionnaireApiService
      .getAnswersByCourse(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.submissions = this.transformAnswerRowsToSubmissions(rows || []);
          this.loading = false;
          if (!this.submissions.length) {
            this.selectedSubmission = null;
          } else if (
            !this.selectedSubmission ||
            !this.submissions.some((item) => this.isSelected(item))
          ) {
            this.selectSubmission(this.submissions[0]);
          }
        },
        error: (err) => {
          console.error('Error loading submissions:', err);
          this.loading = false;
          this.submissionsLoadError = true;
          this.submissions = [];
          this.selectedSubmission = null;
        },
      });
  }

  getQuestionById(questionId: string): any {
    return this.questionsList.find((q) => (q.id ?? '') === questionId) ?? null;
  }

  getQuestionLabel(questionId: string, index: number): string {
    const q = this.getQuestionById(questionId);
    return q?.question ?? `Question ${index + 1}`;
  }

  private transformAnswerRowsToSubmissions(rows: any[]): AnswerSubmission[] {
    const byUser = new Map<
      string,
      { answers: { [questionId: string]: string | string[] }; submittedAt?: string; feedback?: string }
    >();
    rows.forEach((row: any) => {
      const userId = String(row.submitted_by ?? row.submittedBy ?? '');
      const qId = String(row.question_id ?? row.questionId ?? '');
      const answerStr = row.answer ?? '';
      if (!userId || !qId) return;
      if (!byUser.has(userId)) {
        byUser.set(userId, {
          answers: {},
          submittedAt: row.submitted_at ?? row.submittedAt ?? row.creation_date ?? row.created_at,
          feedback: row.feedback,
        });
      }
      const entry = byUser.get(userId)!;
      try {
        const parsed = JSON.parse(answerStr);
        entry.answers[qId] = Array.isArray(parsed) ? parsed : String(parsed);
      } catch {
        entry.answers[qId] = answerStr;
      }
      if (!entry.feedback && row.feedback) {
        entry.feedback = row.feedback;
      }
    });
    const allUsers = this.commonService.allUsersList ?? [];
    return Array.from(byUser.entries()).map(([userId, entry]) => {
      const user = allUsers.find((u) => (u.id ?? '') === userId);
      const userName = this.getUserDisplayName(user);
      const userEmail = this.getUserEmail(user);
      return {
        userId,
        userName,
        userEmail,
        answers: entry.answers,
        submittedAt: entry.submittedAt,
        feedback: entry.feedback,
      };
    });
  }

  private getUserDisplayName(user: any): string {
    if (!user) return '';
    const first = user.firstName ?? user.first_name ?? '';
    const last = user.lastName ?? user.last_name ?? '';
    const name = [first, last].filter(Boolean).join(' ').trim();
    return name || user.name || '';
  }

  private getUserEmail(user: any): string {
    if (!user) return '';
    return user.email ?? user.contact?.email ?? '';
  }

  formatAnswer(value: string | string[]): string {
    if (Array.isArray(value)) return value.join(', ');
    return String(value ?? '');
  }

  saveFeedback(submission: AnswerSubmission): void {
    const id = this.submissionKey(submission);
    const note = (this.feedbackMap[id] ?? '').replace(/^\s*\[(FAIL|PASS|DIST)\]\s*/i, '').trim();
    const feedback = `[${this.selectedGrade}] ${note}`.trim();

    this.questionnaireApiService
      .updateAnswerFeedback(id, { feedback, correctedAnswers: submission.answers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          submission.feedback = feedback;
          this.feedbackMap[id] = note;
          this.confirmationPopupService.showAlert('Feedback saved successfully.', 'Success');
        },
        error: (err) => {
          console.error('Error saving feedback:', err);
          this.confirmationPopupService.showAlert('Error saving feedback. Please try again.', 'Error');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
