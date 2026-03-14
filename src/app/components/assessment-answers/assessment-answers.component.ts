import { Component, Input, OnInit, OnDestroy } from '@angular/core';
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
export class AssessmentAnswersComponent implements OnInit, OnDestroy {
  @Input() courseId: string = '';
  private destroy$ = new Subject<void>();
  public submissions: AnswerSubmission[] = [];
  public questionsList: any[] = [];
  public loading = false;
  public feedbackMap: { [submissionId: string]: string } = {};
  public canAccess = false;

  constructor(
    private questionnaireApiService: QuestionnaireApiService,
    public commonService: CommonService,
    private confirmationPopupService: ConfirmationPopupService
  ) {}

  ngOnInit(): void {
    this.canAccess = this.commonService.adminRoleType.includes(
      this.commonService?.loginedUserInfo?.role ?? ''
    );
    if (!this.canAccess) return;

    this.loadQuestions();
    this.loadSubmissions();
  }

  loadQuestions(): void {
    const courseId = this.courseId?.trim() || undefined;
    this.questionnaireApiService
      .geAllQuestions(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.questionsList = questions || [];
        },
        error: (err) => console.error('Error loading questions:', err),
      });
  }

  loadSubmissions(): void {
    const courseId = this.courseId?.trim() ?? '';
    if (!courseId) {
      this.loading = false;
      this.submissions = [];
      return;
    }
    this.loading = true;
    this.questionnaireApiService
      .getAnswersByCourse(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;
          const rows = Array.isArray(data) ? data : [];
          this.submissions = this.transformAnswerRowsToSubmissions(rows);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading submissions:', err);
          this.loading = false;
          this.submissions = [];
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
    const byUser = new Map<string, { [questionId: string]: string | string[] }>();
    rows.forEach((row: any) => {
      const userId = String(row.submitted_by ?? row.submittedBy ?? '');
      const qId = String(row.question_id ?? row.questionId ?? '');
      const answerStr = row.answer ?? '';
      if (!userId || !qId) return;
      if (!byUser.has(userId)) byUser.set(userId, {});
      const answers = byUser.get(userId)!;
      try {
        const parsed = JSON.parse(answerStr);
        answers[qId] = Array.isArray(parsed) ? parsed : String(parsed);
      } catch {
        answers[qId] = answerStr;
      }
    });
    const allUsers = this.commonService.allUsersList ?? [];
    return Array.from(byUser.entries()).map(([userId, answers]) => {
      const user = allUsers.find((u) => (u.id ?? '') === userId);
      const userName = this.getUserDisplayName(user);
      const userEmail = this.getUserEmail(user);
      return { userId, userName, userEmail, answers };
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
    const id = submission.id ?? submission.userId ?? '';
    const feedback = this.feedbackMap[id] ?? '';

    this.questionnaireApiService
      .updateAnswerFeedback(id, { feedback, correctedAnswers: submission.answers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          submission.feedback = feedback;
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
