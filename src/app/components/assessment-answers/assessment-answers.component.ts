import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { QuestionnaireApiService } from 'src/app/services/api-service/questionnaire-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ConfirmationPopupService } from 'src/app/shared/confirmation-popup/confirmation-popup.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import {
  AnswerFeedbackHistoryItem,
  AnswerFeedbackPayload,
  FeedbackGradeCode,
  FeedbackItemPayload,
  FeedbackItemStatus,
  GRADE_TO_OUTCOME,
  OUTCOME_TO_GRADE,
} from 'src/app/pages/questionnaire/model/answer-feedback.model';
import { AnswerHistoryItem } from 'src/app/pages/questionnaire/model/answer.model';

export interface AnswerSubmission {
  id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  submittedAt?: string;
  answers: { [key: string]: string | string[] };
  /** question_id → answer row id from Logic DB */
  answerIds?: { [questionId: string]: string };
  /** question_id → current answer version */
  answerVersions?: { [questionId: string]: number };
  /** Total answer API rows for this student (includes retries/versions) */
  answerRecordCount?: number;
  questions?: any[];
  feedback?: string;
  outcome?: string;
  gradeCode?: FeedbackGradeCode | string;
  /** Latest published feedback version for optimistic locking */
  feedbackVersion?: number;
  feedbackId?: string;
  correctedAnswers?: { [key: string]: string | string[] };
}

/** One student answer attempt shown as a row under a question */
export interface AnswerAttemptRow {
  attemptNumber: number;
  label: string;
  value: string | string[];
  version?: number;
  /** Overall review grade label (PASS / FAIL / DIST), same as aa-history__grade */
  gradeLabel?: string;
  /** Color key: pass | fail | dist | retry | incomplete | pending */
  statusKey?: string | null;
  teacherComment?: string;
  isCurrent?: boolean;
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
  /** When true, student may retry answers after this review is published */
  public requireRetry = false;
  public savingFeedback = false;
  public feedbackHistory: AnswerFeedbackHistoryItem[] = [];
  public answerHistory: AnswerHistoryItem[] = [];
  public historyLoading = false;
  public answerHistoryLoading = false;
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
    const prevKey = this.submissionKey(this.selectedSubmission);
    const nextKey = this.submissionKey(submission);
    this.selectedSubmission = submission;
    if (prevKey !== nextKey) {
      this.feedbackHistory = [];
      this.answerHistory = [];
    }
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

    this.requireRetry =
      this.selectedGrade === 'FAIL' ||
      submission.outcome === 'needs_resubmission' ||
      submission.outcome === 'fail';

    this.feedbackMap[key] = stored.replace(/^\s*\[(FAIL|PASS|DIST)\]\s*/i, '');
    this.loadFeedbackHistory(submission);
    this.loadAnswerHistory(submission);
  }

  onGradeChange(grade: FeedbackGradeCode): void {
    this.selectedGrade = grade;
    if (grade === 'FAIL') {
      this.requireRetry = true;
    }
  }

  loadFeedbackHistory(submission?: AnswerSubmission | null): void {
    const target = submission ?? this.selectedSubmission;
    const studentUserId = String(target?.userId || '').trim();
    const courseId = this.courseId?.trim();
    if (!studentUserId || !courseId) {
      this.feedbackHistory = [];
      this.historyLoading = false;
      return;
    }

    this.historyLoading = true;
    this.questionnaireApiService
      .getAnswerFeedbackHistory(studentUserId, courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.historyLoading = false;
          if (this.submissionKey(this.selectedSubmission) !== this.submissionKey(target)) {
            return;
          }
          this.feedbackHistory = this.normalizeHistoryItems(items);
        },
        error: () => {
          this.historyLoading = false;
          if (this.submissionKey(this.selectedSubmission) !== this.submissionKey(target)) {
            return;
          }
          this.feedbackHistory = [];
        },
      });
  }

  loadAnswerHistory(submission?: AnswerSubmission | null): void {
    const target = submission ?? this.selectedSubmission;
    const studentUserId = String(target?.userId || '').trim();
    const courseId = this.courseId?.trim();
    if (!studentUserId || !courseId) {
      this.answerHistory = [];
      this.answerHistoryLoading = false;
      return;
    }

    this.answerHistoryLoading = true;
    this.questionnaireApiService
      .getAnswerHistory(courseId, studentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.answerHistoryLoading = false;
          if (this.submissionKey(this.selectedSubmission) !== this.submissionKey(target)) {
            return;
          }
          this.answerHistory = this.normalizeAnswerHistoryItems(items);
        },
        error: () => {
          this.answerHistoryLoading = false;
          if (this.submissionKey(this.selectedSubmission) !== this.submissionKey(target)) {
            return;
          }
          this.answerHistory = [];
        },
      });
  }

  private normalizeAnswerHistoryItems(items: AnswerHistoryItem[]): AnswerHistoryItem[] {
    const list = Array.isArray(items) ? [...items] : [];
    return list.sort((a, b) => {
      const av = typeof a.version === 'number' ? a.version : 0;
      const bv = typeof b.version === 'number' ? b.version : 0;
      if (av !== bv) return av - bv;
      return this.answerHistorySortTime(a) - this.answerHistorySortTime(b);
    });
  }

  private answerHistorySortTime(item: AnswerHistoryItem): number {
    const raw =
      item.modification_date ||
      item.submitted_at ||
      item.updated_at ||
      item.creation_date ||
      item.created_at ||
      0;
    return new Date(raw).getTime() || 0;
  }

  historyReviewerName(item: AnswerFeedbackHistoryItem): string {
    return (
      item.reviewed_by?.display_name ||
      item.reviewed_by_display_name ||
      'Teacher'
    );
  }

  historyGradeLabel(item: AnswerFeedbackHistoryItem): string {
    const code =
      item.review?.grade_code ||
      (item.review?.outcome
        ? OUTCOME_TO_GRADE[item.review.outcome as keyof typeof OUTCOME_TO_GRADE]
        : '') ||
      '';
    return code ? String(code).toUpperCase() : '';
  }

  historyStatusKey(item: AnswerFeedbackHistoryItem): string {
    const grade = this.historyGradeLabel(item);
    const outcome = item.review?.outcome;
    if (item.review?.requires_resubmission || outcome === 'needs_resubmission') {
      if (grade === 'FAIL' || outcome === 'fail') return 'fail';
      return 'retry';
    }
    if (grade === 'FAIL' || outcome === 'fail') return 'fail';
    if (grade === 'DIST' || outcome === 'distinction') return 'dist';
    if (grade === 'PASS' || outcome === 'pass') return 'pass';
    if (outcome === 'incomplete') return 'incomplete';
    return 'pass';
  }

  historySummary(item: AnswerFeedbackHistoryItem): string {
    return (item.review?.summary || '').trim() || '—';
  }

  historyDate(item: AnswerFeedbackHistoryItem): string {
    const raw =
      item.published_at ||
      item.modification_date ||
      item.created_at ||
      item.creation_date ||
      '';
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  historyTrackId(item: AnswerFeedbackHistoryItem, index: number): string {
    return String(item.id || item.feedback_id || item.version || index);
  }

  private historySortTime(item: AnswerFeedbackHistoryItem): number {
    const raw =
      item.published_at ||
      item.modification_date ||
      item.created_at ||
      item.creation_date ||
      0;
    return new Date(raw).getTime() || 0;
  }

  private normalizeHistoryItems(items: AnswerFeedbackHistoryItem[]): AnswerFeedbackHistoryItem[] {
    const list = Array.isArray(items) ? [...items] : [];
    const seen = new Set<string>();
    const unique = list.filter((item, index) => {
      const key = String(item.id || item.feedback_id || `row-${item.version ?? index}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return unique.sort((a, b) => this.historySortTime(b) - this.historySortTime(a));
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
    if (typeof submission.answerRecordCount === 'number') {
      return submission.answerRecordCount;
    }
    return Object.values(submission.answers || {}).filter((value) =>
      this.hasAnswer(value)
    ).length;
  }

  answerTotalCount(): number {
    return this.questionsList.length;
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
      this.feedbackHistory = [];
      this.answerHistory = [];
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
            this.feedbackHistory = [];
            this.answerHistory = [];
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
          this.feedbackHistory = [];
          this.answerHistory = [];
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
        answerVersions: { [questionId: string]: number };
        answerRecordCount: number;
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
          answerVersions: {},
          answerRecordCount: 0,
          submittedAt: row.submitted_at ?? row.submittedAt ?? row.creation_date ?? row.created_at,
          feedback:
            row.review?.summary ??
            row.feedback_summary ??
            row.feedback,
          outcome: row.review?.outcome ?? row.outcome,
          gradeCode: row.review?.grade_code ?? row.grade_code,
          submissionId: row.submission_id ?? row.submissionId,
          feedbackVersion:
            typeof row.feedback_version === 'number' ? row.feedback_version : undefined,
          feedbackId: row.feedback_id ?? row.feedbackId,
        });
      }

      const entry = byUser.get(userId)!;
      entry.answerRecordCount += 1;
      try {
        const parsed = JSON.parse(answerStr);
        entry.answers[qId] = Array.isArray(parsed) ? parsed : String(parsed);
      } catch {
        entry.answers[qId] = answerStr;
      }
      if (answerId) {
        entry.answerIds[qId] = answerId;
      }
      if (typeof row.version === 'number') {
        entry.answerVersions[qId] = row.version;
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
        answerVersions: entry.answerVersions,
        answerRecordCount: entry.answerRecordCount,
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

  /** One row per feedback history entry for this question (oldest → newest). */
  getAnswerAttempts(questionId: string | number): AnswerAttemptRow[] {
    const qId = String(questionId);
    const current = this.selectedSubmission?.answers?.[qId];
    const rows: AnswerAttemptRow[] = [];

    const answerVersions = this.answerHistory
      .filter((row) => String(row.question_id || '') === qId)
      .sort(
        (a, b) =>
          (a.version || 0) - (b.version || 0) ||
          this.answerHistorySortTime(a) - this.answerHistorySortTime(b)
      );

    const historyAsc = [...this.feedbackHistory].sort(
      (a, b) => this.historySortTime(a) - this.historySortTime(b)
    );

    historyAsc.forEach((item, feedbackIndex) => {
      const fb = (item.item_feedback || []).find(
        (entry) => String(entry.question_id) === qId
      );
      if (!fb) return;

      const matchedAnswer = this.matchAnswerHistoryForFeedback(
        fb,
        item,
        feedbackIndex,
        answerVersions
      );

      rows.push({
        attemptNumber: rows.length + 1,
        label: '',
        value: matchedAnswer
          ? this.parseStoredAnswer(matchedAnswer.answer)
          : ((fb.corrected_answer?.value ?? current ?? '') as string | string[]),
        version:
          matchedAnswer?.version ??
          item.assessment?.attempt_number ??
          item.version,
        gradeLabel: this.historyGradeLabel(item),
        statusKey: this.historyStatusKey(item),
        teacherComment: fb.teacher_comment,
        isCurrent: false,
      });
    });

    if (rows.length === 0 && this.hasAnswer(current)) {
      rows.push({
        attemptNumber: 1,
        label: 'Answer',
        value: current as string | string[],
        version: this.selectedSubmission?.answerVersions?.[qId],
        gradeLabel: '',
        statusKey: null,
        isCurrent: true,
      });
    } else if (rows.length > 0) {
      rows[rows.length - 1].isCurrent = true;
    }

    rows.forEach((row, index) => {
      row.attemptNumber = index + 1;
      const ver = row.version ? ` · v${row.version}` : '';
      row.label =
        rows.length === 1 ? `Answer${ver}` : `Attempt ${index + 1}${ver}`;
    });

    return rows;
  }

  /** Prefer versioned student answers over corrected_answer (often latest snapshot). */
  private matchAnswerHistoryForFeedback(
    fb: FeedbackItemPayload,
    item: AnswerFeedbackHistoryItem,
    feedbackIndex: number,
    answerVersions: AnswerHistoryItem[]
  ): AnswerHistoryItem | null {
    if (!answerVersions.length) return null;

    // Retries often keep the same answer_id, so version/index beat id matching.
    const attemptNumber =
      item.assessment?.attempt_number ??
      (typeof item.version === 'number' ? item.version : undefined);
    if (typeof attemptNumber === 'number') {
      const byVersion = answerVersions.find((row) => row.version === attemptNumber);
      if (byVersion) return byVersion;
    }

    if (answerVersions[feedbackIndex]) {
      return answerVersions[feedbackIndex];
    }

    if (fb.answer_id) {
      const byId = answerVersions.find(
        (row) => String(row.id || '') === String(fb.answer_id)
      );
      if (byId) return byId;
    }

    return null;
  }

  private parseStoredAnswer(raw: unknown): string | string[] {
    const text = String(raw ?? '');
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : String(parsed);
    } catch {
      return text;
    }
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
      (this.commonService.loginedUserInfo?.role === 'organization'
        ? this.commonService.loginedUserInfo?.id
        : '') ||
      '';

    if (!organizationId) {
      this.confirmationPopupService.showAlert(
        'Organization id is required to publish feedback.',
        'Error'
      );
      return;
    }

    const reviewer = this.resolveReviewerIdentity();
    if (!reviewer.userId) {
      this.confirmationPopupService.showAlert(
        'Reviewer identity is missing. Please sign in again.',
        'Error'
      );
      return;
    }

    const payload = this.buildCorporateFeedbackPayload(submission, {
      organizationId,
      courseId,
      summary,
      grade: this.selectedGrade,
      requireRetry: this.requireRetry,
      reviewedByUserId: reviewer.userId,
      reviewedByRole: reviewer.role,
      reviewedByDisplayName: reviewer.displayName,
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
          this.requireRetry = review?.requires_resubmission === true || this.requireRetry;
          this.loadFeedbackHistory(submission);

          const emailed = res?.data?.notification?.emailed === true;
          this.commonService.openToaster({
            message: emailed
              ? 'Feedback published and student notified by email.'
              : 'Feedback published successfully.',
            messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
          });
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
          this.commonService.openToaster({
            message: String(message),
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        },
      });
  }

  private buildCorporateFeedbackPayload(
    submission: AnswerSubmission,
    opts: {
      organizationId: string;
      courseId: string;
      summary: string;
      grade: FeedbackGradeCode;
      requireRetry: boolean;
      reviewedByUserId: string;
      reviewedByRole: string;
      reviewedByDisplayName: string;
    }
  ): AnswerFeedbackPayload {
    const requiresResubmission = opts.requireRetry || opts.grade === 'FAIL';
    const outcome = requiresResubmission && opts.grade === 'FAIL'
      ? GRADE_TO_OUTCOME[opts.grade]
      : requiresResubmission && opts.grade !== 'FAIL'
        ? 'needs_resubmission'
        : GRADE_TO_OUTCOME[opts.grade];
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

    return {
      organization_id: opts.organizationId,
      reviewed_by_user_id: opts.reviewedByUserId,
      reviewed_by_role: opts.reviewedByRole,
      reviewed_by_display_name: opts.reviewedByDisplayName,
      course_id: opts.courseId,
      submission_id:
        submission.id && submission.id !== submission.userId ? submission.id : null,
      assessment: {
        attempt_number: Math.max(
          1,
          ...Object.values(submission.answerVersions || {}).map((v) => Number(v) || 1),
          1
        ),
        submitted_at: submission.submittedAt,
        locale: navigator.language || 'en-GB',
      },
      review: {
        outcome,
        grade_code: opts.grade,
        summary: opts.summary,
        visibility: 'student_visible',
        requires_resubmission: requiresResubmission,
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
  }

  private resolveReviewerIdentity(): {
    userId: string;
    role: string;
    displayName: string;
  } {
    const info = this.commonService.loginedUserInfo;
    const userId = (info?.id || '').trim();
    const role = (info?.role || 'teacher').trim() || 'teacher';

    if (role === 'organization') {
      const displayName =
        info?.name?.trim() ||
        sessionStorage.getItem('activeOrganizationName')?.trim() ||
        'Organization';
      return { userId, role, displayName };
    }

    const first = (info?.firstName || info?.first_name || '').trim();
    const last = (info?.lastName || info?.last_name || '').trim();
    const displayName =
      [first, last].filter(Boolean).join(' ') ||
      info?.name?.trim() ||
      info?.email?.trim() ||
      info?.contact?.email?.trim() ||
      'Teacher';

    return { userId, role, displayName };
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
