import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { QuestionnaireApiService } from 'src/app/services/api-service/questionnaire-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ConfirmationPopupService } from 'src/app/shared/confirmation-popup/confirmation-popup.service';
import {
  AnswerFeedbackPayload,
  FeedbackGradeCode,
  FeedbackItemPayload,
  FeedbackItemStatus,
  GRADE_TO_OUTCOME,
  OUTCOME_TO_GRADE,
} from 'src/app/pages/questionnaire/model/answer-feedback.model';

export interface AnswerSubmission {
  id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  submittedAt?: string;
  answers: { [key: string]: string | string[] };
  /** question_id → answer row id from Logic DB */
  answerIds?: { [questionId: string]: string };
  questions?: any[];
  feedback?: string;
  outcome?: string;
  gradeCode?: FeedbackGradeCode | string;
  /** Latest published feedback version for optimistic locking */
  feedbackVersion?: number;
  feedbackId?: string;
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
  public selectedGrade: FeedbackGradeCode = 'PASS';
  public savingFeedback = false;
  readonly gradeOptions: FeedbackGradeCode[] = ['FAIL', 'PASS', 'DIST'];

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

    if (submission.gradeCode && this.gradeOptions.includes(submission.gradeCode as FeedbackGradeCode)) {
      this.selectedGrade = submission.gradeCode as FeedbackGradeCode;
    } else if (submission.outcome && OUTCOME_TO_GRADE[submission.outcome as keyof typeof OUTCOME_TO_GRADE]) {
      this.selectedGrade = OUTCOME_TO_GRADE[submission.outcome as keyof typeof OUTCOME_TO_GRADE]!;
    } else {
      const gradeMatch = stored.match(/^\s*\[(FAIL|PASS|DIST)\]\s*/i);
      this.selectedGrade = gradeMatch
        ? (gradeMatch[1].toUpperCase() as FeedbackGradeCode)
        : 'PASS';
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
    return String(submission.userId ?? submission.id ?? '');
  }

  shortStudentId(submission: AnswerSubmission): string {
    const raw = this.submissionKey(submission) || '0000';
    return `STU_${raw.slice(-4).toUpperCase()}`;
  }

  studentInitials(submission: AnswerSubmission): string {
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
      {
        answers: { [questionId: string]: string | string[] };
        answerIds: { [questionId: string]: string };
        submittedAt?: string;
        feedback?: string;
        outcome?: string;
        gradeCode?: string;
        submissionId?: string;
        feedbackVersion?: number;
        feedbackId?: string;
      }
    >();

    rows.forEach((row: any) => {
      const userId = String(row.submitted_by ?? row.submittedBy ?? '');
      const qId = String(row.question_id ?? row.questionId ?? '');
      const answerStr = row.answer ?? '';
      const answerId = String(row.id ?? row.answer_id ?? row.answerId ?? '');
      if (!userId || !qId) return;

      if (!byUser.has(userId)) {
        byUser.set(userId, {
          answers: {},
          answerIds: {},
          submittedAt: row.submitted_at ?? row.submittedAt ?? row.creation_date ?? row.created_at,
          feedback:
            row.review?.summary ??
            row.feedback_summary ??
            row.feedback,
          outcome: row.review?.outcome ?? row.outcome,
          gradeCode: row.review?.grade_code ?? row.grade_code,
          submissionId: row.submission_id ?? row.submissionId,
          feedbackVersion:
            typeof row.feedback_version === 'number'
              ? row.feedback_version
              : typeof row.version === 'number'
                ? row.version
                : undefined,
          feedbackId: row.feedback_id ?? row.feedbackId,
        });
      }

      const entry = byUser.get(userId)!;
      try {
        const parsed = JSON.parse(answerStr);
        entry.answers[qId] = Array.isArray(parsed) ? parsed : String(parsed);
      } catch {
        entry.answers[qId] = answerStr;
      }
      if (answerId) {
        entry.answerIds[qId] = answerId;
      }
      if (!entry.feedback && (row.review?.summary || row.feedback)) {
        entry.feedback = row.review?.summary ?? row.feedback;
      }
      if (!entry.outcome && (row.review?.outcome || row.outcome)) {
        entry.outcome = row.review?.outcome ?? row.outcome;
      }
      if (!entry.gradeCode && (row.review?.grade_code || row.grade_code)) {
        entry.gradeCode = row.review?.grade_code ?? row.grade_code;
      }
      if (!entry.submissionId && (row.submission_id || row.submissionId)) {
        entry.submissionId = row.submission_id ?? row.submissionId;
      }
    });

    const allUsers = this.commonService.allUsersList ?? [];
    return Array.from(byUser.entries()).map(([userId, entry]) => {
      const user = allUsers.find((u) => (u.id ?? '') === userId);
      return {
        id: entry.submissionId || userId,
        userId,
        userName: this.getUserDisplayName(user),
        userEmail: this.getUserEmail(user),
        answers: entry.answers,
        answerIds: entry.answerIds,
        submittedAt: entry.submittedAt,
        feedback: entry.feedback,
        outcome: entry.outcome,
        gradeCode: entry.gradeCode,
        feedbackVersion: entry.feedbackVersion,
        feedbackId: entry.feedbackId,
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
    const studentUserId = String(submission.userId || '').trim();
    if (!studentUserId) {
      this.confirmationPopupService.showAlert(
        'Missing student id for this submission.',
        'Error'
      );
      return;
    }

    const courseId = this.courseId?.trim();
    if (!courseId) {
      this.confirmationPopupService.showAlert('Course id is required.', 'Error');
      return;
    }

    const key = this.submissionKey(submission);
    const summary = (this.feedbackMap[key] ?? '')
      .replace(/^\s*\[(FAIL|PASS|DIST)\]\s*/i, '')
      .trim();
    if (!summary) {
      this.confirmationPopupService.showAlert(
        'Please enter feedback summary before saving.',
        'Error'
      );
      return;
    }

    const organizationId =
      sessionStorage.getItem('organization_id') ||
      this.commonService.loginedUserInfo?.organization_id ||
      '';

    const payload = this.buildCorporateFeedbackPayload(submission, {
      organizationId: organizationId || undefined,
      courseId,
      summary,
      grade: this.selectedGrade,
    });

    this.savingFeedback = true;
    this.questionnaireApiService
      .publishAnswerFeedback(studentUserId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.savingFeedback = false;
          const review = res?.data?.review;
          submission.feedback = review?.summary || summary;
          submission.outcome = review?.outcome || GRADE_TO_OUTCOME[this.selectedGrade];
          submission.gradeCode = review?.grade_code || this.selectedGrade;
          if (res?.data?.submission_id) {
            submission.id = res.data.submission_id;
          }
          if (typeof res?.data?.version === 'number') {
            submission.feedbackVersion = res.data.version;
          }
          if (res?.data?.feedback_id) {
            submission.feedbackId = res.data.feedback_id;
          }
          this.feedbackMap[key] = submission.feedback;

          const emailed = res?.data?.notification?.emailed === true;
          this.confirmationPopupService.showAlert(
            emailed
              ? 'Feedback published and student notified by email.'
              : 'Feedback published successfully.',
            'Success'
          );
        },
        error: (err) => {
          this.savingFeedback = false;
          console.error('Error saving feedback:', err);
          const status = err?.status ?? err?.statusCode;
          const message =
            status === 409
              ? 'Feedback was updated elsewhere. Refresh and try again.'
              : err?.message ||
                err?.msg ||
                (Array.isArray(err?.errors) ? err.errors[0]?.msg : null) ||
                'Error saving feedback. Please try again.';
          this.confirmationPopupService.showAlert(String(message), 'Error');
        },
      });
  }

  private buildCorporateFeedbackPayload(
    submission: AnswerSubmission,
    opts: {
      organizationId?: string;
      courseId: string;
      summary: string;
      grade: FeedbackGradeCode;
    }
  ): AnswerFeedbackPayload {
    const outcome = GRADE_TO_OUTCOME[opts.grade];
    const itemFeedback: FeedbackItemPayload[] = Object.entries(submission.answers || {}).map(
      ([questionId, value]) => {
        const question = this.getQuestionById(questionId);
        const type = String(question?.type || '').toLowerCase();
        const correctedType =
          type === 'checkbox' || Array.isArray(value)
            ? 'multi_choice'
            : type === 'radio' || type === 'dropdown'
              ? 'single_choice'
              : 'text';

        return {
          question_id: questionId,
          answer_id: submission.answerIds?.[questionId] || null,
          status: this.defaultItemStatus(opts.grade),
          teacher_comment: opts.summary,
          corrected_answer: {
            type: correctedType,
            value,
          },
          tags: [],
        };
      }
    );

    const payload: AnswerFeedbackPayload = {
      course_id: opts.courseId,
      submission_id:
        submission.id && submission.id !== submission.userId ? submission.id : null,
      assessment: {
        attempt_number: 1,
        submitted_at: submission.submittedAt,
        locale: navigator.language || 'en-GB',
      },
      review: {
        outcome,
        grade_code: opts.grade,
        summary: opts.summary,
        visibility: 'student_visible',
        requires_resubmission: opts.grade === 'FAIL',
        resubmission_due_at: null,
      },
      item_feedback: itemFeedback,
      notifications: {
        notify_student: true,
        channels: ['in_app', 'email'],
      },
      metadata: {
        source: 'web.teacher_review',
        client_request_id: `req-${Date.now().toString(36)}`,
        reviewed_at: new Date().toISOString(),
        ...(typeof submission.feedbackVersion === 'number'
          ? { expected_version: submission.feedbackVersion }
          : {}),
      },
    };

    // Optional — JWT is source of truth; send only when known (must match JWT org).
    if (opts.organizationId) {
      payload.organization_id = opts.organizationId;
    }

    return payload;
  }

  private defaultItemStatus(grade: FeedbackGradeCode): FeedbackItemStatus {
    if (grade === 'FAIL') return 'incorrect';
    if (grade === 'DIST') return 'correct';
    return 'partial';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
