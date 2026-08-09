import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { QuestionnaireApiService } from 'src/app/services/api-service/questionnaire-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ConfirmationPopupService } from 'src/app/shared/confirmation-popup/confirmation-popup.service';
import { IQuestion } from 'src/app/pages/questionnaire/model/question.model';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import {
  AnswerFeedbackHistoryItem,
  AnswerFeedbackResponseData,
  FeedbackReviewPayload,
  OUTCOME_TO_GRADE,
} from 'src/app/pages/questionnaire/model/answer-feedback.model';
// TODO: remove answer-attempts later if not needed
// import { AnswerHistoryItem } from 'src/app/pages/questionnaire/model/answer.model';

@Component({
  selector: 'app-student-assessment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './student-assessment.component.html',
  styleUrl: './student-assessment.component.scss',
})
export class StudentAssessmentComponent implements OnInit, OnChanges, OnDestroy {
  @Input() courseId: string = '';
  private destroy$ = new Subject<void>();
  public questionsList: IQuestion[] = [];
  public answers: Record<string, string | string[]> = {};
  /** question_id → existing answer row id (needed for retry updates) */
  public answerIds: Record<string, string> = {};
  /** question_id → current answer version */
  public answerVersions: Record<string, number> = {};
  public loading = false;
  public submitting = false;
  public hasSubmitted = false;
  /** Teacher published feedback allows another attempt */
  public canRetry = false;
  /** Student chose to edit after retry was allowed */
  public isRetrying = false;
  public teacherFeedback: FeedbackReviewPayload | null = null;
  public feedbackMeta: {
    reviewedBy?: string;
    publishedAt?: string;
    gradeCode?: string;
  } = {};
  public feedbackLoading = false;
  public feedbackHistory: AnswerFeedbackHistoryItem[] = [];
  // TODO: remove answer-attempts later if not needed
  // public answerHistory: AnswerHistoryItem[] = [];
  public historyLoading = false;
  // public answerHistoryLoading = false;
  /** Latest answer row timestamp (ms) — used to detect completed resubmission */
  private latestAnswerAtMs = 0;
  /** Local guard right after retry submit until feedback reloads */
  private retrySubmittedPendingReview = false;
  /** True when student resubmitted after teacher requested retry and is waiting for new review */
  public awaitingReviewAfterRetry = false;

  constructor(
    private questionnaireApiService: QuestionnaireApiService,
    public commonService: CommonService,
    private confirmationPopupService: ConfirmationPopupService
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['courseId'] && !changes['courseId'].firstChange) {
      this.loadQuestions();
    }
  }

  get inputsLocked(): boolean {
    return this.hasSubmitted && !this.isRetrying;
  }

  get feedbackVisible(): boolean {
    return !!this.teacherFeedback?.summary && this.teacherFeedback.visibility !== 'internal_only';
  }

  get outcomeLabel(): string {
    const outcome = this.teacherFeedback?.outcome;
    if (!outcome) return '';
    const grade = OUTCOME_TO_GRADE[outcome as keyof typeof OUTCOME_TO_GRADE];
    return (grade || outcome).toString().toUpperCase();
  }

  /** Normalized status key for panel styling: fail | pass | dist | retry | incomplete */
  get feedbackStatusKey(): string {
    const grade = String(this.feedbackMeta.gradeCode || this.outcomeLabel || '').toUpperCase();
    const outcome = this.teacherFeedback?.outcome;

    if (grade === 'FAIL' || outcome === 'fail') return 'fail';
    if (grade === 'DIST' || outcome === 'distinction') return 'dist';
    if (grade === 'PASS' || outcome === 'pass') return 'pass';
    if (outcome === 'incomplete') return 'incomplete';
    if (this.canRetry || outcome === 'needs_resubmission') return 'retry';
    return 'pass';
  }

  get feedbackStatusLabel(): string {
    if (this.awaitingReviewAfterRetry) {
      return 'Resubmitted — awaiting review';
    }
    if (this.canRetry && this.feedbackStatusKey === 'fail') {
      return 'Failed — retry required';
    }
    if (this.canRetry && this.feedbackStatusKey !== 'retry') {
      return `${this.gradeOnlyStatusLabel} — retry required`;
    }
    switch (this.feedbackStatusKey) {
      case 'fail':
        return 'Failed';
      case 'pass':
        return 'Passed';
      case 'dist':
        return 'Distinction';
      case 'retry':
        return 'Retry required';
      case 'incomplete':
        return 'Incomplete';
      default:
        return this.outcomeLabel || 'Reviewed';
    }
  }

  private get gradeOnlyStatusLabel(): string {
    switch (this.feedbackStatusKey) {
      case 'fail':
        return 'Failed';
      case 'pass':
        return 'Passed';
      case 'dist':
        return 'Distinction';
      case 'incomplete':
        return 'Incomplete';
      default:
        return 'Reviewed';
    }
  }

  get feedbackGradeDisplay(): string {
    return String(this.feedbackMeta.gradeCode || this.outcomeLabel || '').toUpperCase();
  }

  loadQuestions(): void {
    const id = this.courseId || (this.commonService.loginedUserInfo as any)?.selectedCourseId;
    if (!id) return;

    this.loading = true;
    this.hasSubmitted = false;
    this.canRetry = false;
    this.isRetrying = false;
    this.teacherFeedback = null;
    this.feedbackMeta = {};
    this.answerIds = {};
    this.answerVersions = {};
    this.feedbackHistory = [];
    // TODO: remove answer-attempts later if not needed
    // this.answerHistory = [];
    this.historyLoading = false;
    // this.answerHistoryLoading = false;
    this.latestAnswerAtMs = 0;
    this.retrySubmittedPendingReview = false;
    this.awaitingReviewAfterRetry = false;

    this.questionnaireApiService
      .getQuestionsByCourse(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const rawList = response ?? [];
          this.questionsList = [...rawList].sort((a: any, b: any) => {
            const dateA = a.creation_date || a.creationDate || a.created_at || a.createdAt || '';
            const dateB = b.creation_date || b.creationDate || b.created_at || b.createdAt || '';
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          });
          this.answers = {};
          this.questionsList.forEach((question: any, index: number) => {
            const questionId = question.id || String(index);
            if ((question.type || '').toLowerCase() === 'checkbox') {
              this.answers[questionId] = [];
            } else {
              this.answers[questionId] = '';
            }
          });
          this.loading = false;
          this.loadSubmittedAnswers();
        },
        error: () => {
          this.loading = false;
          this.questionsList = [];
          this.confirmationPopupService.showAlert('Error loading questions. Please try again.', 'Error');
        },
      });
  }

  loadSubmittedAnswers(): void {
    const courseId = this.courseId || (this.commonService.loginedUserInfo as any)?.selectedCourseId;
    const submittedBy = this.commonService.loginedUserInfo?.id ?? '';
    if (!courseId || !submittedBy) return;

    this.questionnaireApiService
      .getStudentAnswersByCourse(courseId, submittedBy)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const raw = response ?? [];
          if (raw.length === 0) return;
          this.hasSubmitted = true;
          const answerMap: Record<string, string | string[]> = {};
          const idMap: Record<string, string> = {};
          const versionMap: Record<string, number> = {};
          let latestMs = 0;
          raw.forEach((row: any) => {
            const qId = String(row.question_id ?? row.questionId ?? '');
            const answerStr = row.answer ?? '';
            const answerId = String(row.id ?? row.answer_id ?? row.answerId ?? '');
            if (!qId) return;
            try {
              const parsed = JSON.parse(answerStr);
              answerMap[qId] = Array.isArray(parsed) ? parsed : String(parsed);
            } catch {
              answerMap[qId] = answerStr;
            }
            if (answerId) {
              idMap[qId] = answerId;
            }
            if (typeof row.version === 'number') {
              versionMap[qId] = row.version;
            }
            const rowMs = this.parseTimestampMs(
              row.modification_date ??
                row.modified_at ??
                row.updated_at ??
                row.submitted_at ??
                row.creation_date ??
                row.created_at
            );
            if (rowMs > latestMs) {
              latestMs = rowMs;
            }
          });
          this.answers = { ...this.answers, ...answerMap };
          this.answerIds = idMap;
          this.answerVersions = versionMap;
          this.latestAnswerAtMs = latestMs;
          this.loadTeacherFeedback();
          // TODO: remove answer-attempts later if not needed
          // this.loadAnswerHistoryRows(submittedBy, courseId);
        },
        error: () => {},
      });
  }

  loadTeacherFeedback(): void {
    const courseId = this.courseId || (this.commonService.loginedUserInfo as any)?.selectedCourseId;
    const studentId = this.commonService.loginedUserInfo?.id ?? '';
    if (!courseId || !studentId) return;

    this.feedbackLoading = true;
    this.loadFeedbackHistory(studentId, courseId);
    this.questionnaireApiService
      .getAnswerFeedback(studentId, courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.feedbackLoading = false;
          this.applyFeedbackData(data);
        },
        error: () => {
          this.feedbackLoading = false;
        },
      });
  }

  loadFeedbackHistory(studentId?: string, courseId?: string): void {
    const sid = studentId || this.commonService.loginedUserInfo?.id || '';
    const cid =
      courseId ||
      this.courseId ||
      (this.commonService.loginedUserInfo as any)?.selectedCourseId ||
      '';
    if (!sid || !cid) {
      this.feedbackHistory = [];
      this.historyLoading = false;
      return;
    }

    this.historyLoading = true;
    this.questionnaireApiService
      .getAnswerFeedbackHistory(sid, cid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.historyLoading = false;
          this.feedbackHistory = this.normalizeHistoryItems(items).filter((item) =>
            this.isStudentVisibleHistory(item)
          );
        },
        error: () => {
          this.historyLoading = false;
        },
      });
  }

  // TODO: remove answer-attempts later if not needed
  // loadAnswerHistoryRows(studentId?: string, courseId?: string): void {
  //   const sid = studentId || this.commonService.loginedUserInfo?.id || '';
  //   const cid =
  //     courseId ||
  //     this.courseId ||
  //     (this.commonService.loginedUserInfo as any)?.selectedCourseId ||
  //     '';
  //   if (!sid || !cid) {
  //     this.answerHistory = [];
  //     this.answerHistoryLoading = false;
  //     return;
  //   }
  //
  //   this.answerHistoryLoading = true;
  //   this.questionnaireApiService
  //     .getAnswerHistory(cid, sid)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (items) => {
  //         this.answerHistoryLoading = false;
  //         this.answerHistory = Array.isArray(items) ? [...items] : [];
  //       },
  //       error: () => {
  //         this.answerHistoryLoading = false;
  //       },
  //     });
  // }
  //
  // getAnswerAttemptsForQuestion(questionId: string | number): Array<{
  //   version: number;
  //   label: string;
  //   value: string;
  //   isCurrent: boolean;
  // }> {
  //   const qId = String(questionId);
  //   const rows = this.answerHistory
  //     .filter((row) => String(row.question_id || '') === qId)
  //     .sort((a, b) => (a.version || 0) - (b.version || 0));
  //
  //   return rows.map((row, index) => {
  //     const version = typeof row.version === 'number' ? row.version : index + 1;
  //     const isCurrent = index === rows.length - 1;
  //     let value = String(row.answer ?? '');
  //     try {
  //       const parsed = JSON.parse(value);
  //       value = Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
  //     } catch {
  //       /* keep raw */
  //     }
  //     return {
  //       version,
  //       label: `Attempt ${index + 1}${isCurrent ? ' (current)' : ''}`,
  //       value,
  //       isCurrent,
  //     };
  //   });
  // }

  private isStudentVisibleHistory(item: AnswerFeedbackHistoryItem): boolean {
    const visibility = item.review?.visibility;
    return !visibility || visibility === 'student_visible';
  }

  private normalizeHistoryItems(items: AnswerFeedbackHistoryItem[]): AnswerFeedbackHistoryItem[] {
    const list = Array.isArray(items) ? [...items] : [];
    return list.sort((a, b) => this.historySortTime(b) - this.historySortTime(a));
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

  historyTrackId(item: AnswerFeedbackHistoryItem, index: number): string {
    const base = item.id || item.feedback_id || item.published_at || item.creation_date || 'row';
    return `${base}:v${item.version ?? index}`;
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

  private applyFeedbackData(data: AnswerFeedbackResponseData | null): void {
    if (!data?.review) {
      this.teacherFeedback = null;
      this.canRetry = false;
      return;
    }

    this.teacherFeedback = data.review;

    const reviewedBy =
      data.reviewed_by?.display_name ||
      data.reviewed_by_display_name ||
      '';
    const grade =
      data.review.grade_code ||
      OUTCOME_TO_GRADE[data.review.outcome as keyof typeof OUTCOME_TO_GRADE] ||
      '';

    this.feedbackMeta = {
      reviewedBy,
      publishedAt: data.published_at,
      gradeCode: grade ? String(grade) : undefined,
    };

    const teacherRequestedRetry =
      data.review.requires_resubmission === true ||
      data.review.outcome === 'needs_resubmission';

    const feedbackAtMs = this.parseTimestampMs(
      data.published_at ||
        (data as any).modification_date ||
        (data as any).metadata?.reviewed_at
    );

    // Student already resubmitted after this feedback → waiting for new review
    const alreadyResubmittedAfterFeedback =
      teacherRequestedRetry &&
      feedbackAtMs > 0 &&
      this.latestAnswerAtMs > feedbackAtMs;

    if (alreadyResubmittedAfterFeedback) {
      this.retrySubmittedPendingReview = false;
    }

    this.awaitingReviewAfterRetry =
      teacherRequestedRetry &&
      (this.retrySubmittedPendingReview || alreadyResubmittedAfterFeedback);

    this.canRetry =
      teacherRequestedRetry &&
      !this.retrySubmittedPendingReview &&
      !alreadyResubmittedAfterFeedback;

    if (!this.canRetry) {
      this.isRetrying = false;
    }
  }

  private parseTimestampMs(value: unknown): number {
    if (!value) return 0;
    const ms = new Date(String(value)).getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  startRetry(): void {
    if (!this.canRetry) return;
    this.isRetrying = true;
  }

  cancelRetry(): void {
    this.isRetrying = false;
    this.loadSubmittedAnswers();
  }

  normalizeType(type?: string): string {
    const t = (type || 'text').toLowerCase();
    const map: Record<string, string> = {
      text: 'Textbox',
      textarea: 'Textarea',
      radio: 'Radio',
      checkbox: 'Checkbox',
      dropdown: 'Dropdown',
    };
    return map[t] || 'Textbox';
  }

  formatAnswerDisplay(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value.join(', ');
    return String(value ?? '').trim();
  }

  isCheckboxChecked(questionId: string | number, optionValue: string): boolean {
    const ans = this.answers[String(questionId)];
    return Array.isArray(ans) && ans.includes(optionValue);
  }

  get canSubmit(): boolean {
    if (!this.questionsList.length) return false;
    const allAnswered = this.questionsList.every((q, idx) => {
      const id = q.id ?? String(idx);
      const ans = this.answers[id];
      if (this.normalizeType(q.type) === 'Checkbox') {
        return Array.isArray(ans) && ans.length > 0;
      }
      return ans !== undefined && String(ans).trim() !== '';
    });
    return allAnswered;
  }

  handleCheckboxChange(questionId: string | number, optionValue: string, event: Event): void {
    const id = String(questionId);
    const target = event.target as HTMLInputElement;
    if (!this.answers[id] || !Array.isArray(this.answers[id])) {
      this.answers[id] = [];
    }
    const arr = this.answers[id] as string[];
    if (target.checked) {
      if (!arr.includes(optionValue)) arr.push(optionValue);
    } else {
      const idx = arr.indexOf(optionValue);
      if (idx > -1) arr.splice(idx, 1);
    }
  }

  submitAnswers(): void {
    const unanswered = this.questionsList.filter((q, idx) => {
      const id = q.id ?? String(idx);
      const ans = this.answers[id];
      if (this.normalizeType(q.type) === 'Checkbox') {
        return !ans || !Array.isArray(ans) || ans.length === 0;
      }
      return !ans || String(ans).trim() === '';
    });

    if (unanswered.length > 0) {
      this.confirmationPopupService.showAlert(
        `Please answer all questions. ${unanswered.length} question(s) remaining.`,
        'Incomplete'
      );
      return;
    }

    const submittedBy = this.commonService.loginedUserInfo?.id ?? '';
    if (!submittedBy) {
      this.confirmationPopupService.showAlert('Unable to identify user. Please log in again.', 'Error');
      return;
    }
    if (!this.courseId) {
      this.confirmationPopupService.showAlert('Course information is missing.', 'Error');
      return;
    }

    const isRetrySubmit = this.isRetrying && this.hasSubmitted;
    const createPayload = this.questionsList.map((q, idx) => {
      const questionId = String(q.id ?? idx);
      const raw = this.answers[questionId];
      const answer = JSON.stringify(raw ?? '');
      return {
        course_id: this.courseId,
        question_id: questionId,
        answer,
        submitted_by: submittedBy,
        version: 1,
      };
    });

    const updatePayload = this.questionsList
      .map((q, idx) => {
        const questionId = String(q.id ?? idx);
        const answerId = this.answerIds[questionId];
        if (!answerId) return null;
        const currentVersion = this.answerVersions[questionId] || 1;
        return {
          id: answerId,
          course_id: this.courseId,
          question_id: questionId,
          answer: JSON.stringify(this.answers[questionId] ?? ''),
          submitted_by: submittedBy,
          version: currentVersion + 1,
          expected_version: currentVersion,
        };
      })
      .filter((row): row is NonNullable<typeof row> => !!row);

    this.submitting = true;
    const request$ =
      isRetrySubmit && updatePayload.length > 0
        ? this.questionnaireApiService.updateAnswers(updatePayload)
        : this.questionnaireApiService.submitAnswers(createPayload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.submitting = false;
        this.hasSubmitted = true;
        this.isRetrying = false;
        this.canRetry = false;
        if (isRetrySubmit) {
          this.retrySubmittedPendingReview = true;
          this.awaitingReviewAfterRetry = true;
          this.latestAnswerAtMs = Date.now();
        }
        this.commonService.openToaster({
          message: isRetrySubmit
            ? 'Updated answers submitted successfully!'
            : 'Answers submitted successfully!',
          messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
        });
        this.loadSubmittedAnswers();
      },
      error: () => {
        this.submitting = false;
        this.commonService.openToaster({
          message: 'Error submitting answers. Please try again.',
          messageType: TOASTER_MESSAGE_TYPE.ERROR,
        });
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
