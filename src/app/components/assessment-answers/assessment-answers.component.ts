import { Component, OnInit, OnDestroy } from '@angular/core';
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
  private destroy$ = new Subject<void>();
  public submissions: AnswerSubmission[] = [];
  public questionsList: any[] = [];
  public loading = false;
  public expandedSubmissionId: string | null = null;
  public editingSubmissionId: string | null = null;
  public feedbackMap: { [submissionId: string]: string } = {};
  public correctedAnswersMap: { [submissionId: string]: { [questionId: string]: string | string[] } } = {};
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
    this.questionnaireApiService
      .geAllQuestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.questionsList = questions || [];
        },
        error: (err) => console.error('Error loading questions:', err),
      });
  }

  loadSubmissions(): void {
    this.loading = true;
    this.questionnaireApiService
      .getSubmittedAnswers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;
          this.submissions = Array.isArray(data) ? data : [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading submissions:', err);
          this.loading = false;
          this.submissions = [];
        },
      });
  }

  toggleExpand(submission: AnswerSubmission): void {
    const id = submission.id ?? submission.userId ?? '';
    this.expandedSubmissionId = this.expandedSubmissionId === id ? null : id;
  }

  startEditing(submission: AnswerSubmission): void {
    const id = submission.id ?? submission.userId ?? '';
    this.editingSubmissionId = id;
    this.feedbackMap[id] = submission.feedback ?? '';
    this.correctedAnswersMap[id] = { ...(submission.correctedAnswers ?? submission.answers) };
  }

  cancelEditing(): void {
    this.editingSubmissionId = null;
  }

  getQuestionById(questionId: string): any {
    return this.questionsList.find((q) => (q.id ?? '') === questionId) ?? null;
  }

  getQuestionLabel(questionId: string, index: number): string {
    const q = this.getQuestionById(questionId);
    return q?.question ?? `Question ${index + 1}`;
  }

  formatAnswer(value: string | string[]): string {
    if (Array.isArray(value)) return value.join(', ');
    return String(value ?? '');
  }

  saveFeedback(submission: AnswerSubmission): void {
    const id = submission.id ?? submission.userId ?? '';
    const feedback = this.feedbackMap[id] ?? '';
    const correctedAnswers = this.correctedAnswersMap[id] ?? submission.answers;

    this.questionnaireApiService
      .updateAnswerFeedback(id, { feedback, correctedAnswers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          submission.feedback = feedback;
          submission.correctedAnswers = correctedAnswers;
          this.editingSubmissionId = null;
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
