import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { QuestionnaireApiService } from 'src/app/services/api-service/questionnaire-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ConfirmationPopupService } from 'src/app/shared/confirmation-popup/confirmation-popup.service';
import { IQuestion } from 'src/app/pages/questionnaire/model/question.model';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-student-assessment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './student-assessment.component.html',
  styleUrl: './student-assessment.component.scss',
})
export class StudentAssessmentComponent implements OnInit, OnDestroy {
  @Input() courseId: string = '';
  private destroy$ = new Subject<void>();
  public questionsList: IQuestion[] = [];
  public answers: Record<string, string | string[]> = {};
  public loading = false;
  public submitting = false;
  public hasSubmitted = false;

  constructor(
    private questionnaireApiService: QuestionnaireApiService,
    public commonService: CommonService,
    private confirmationPopupService: ConfirmationPopupService
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    const id = this.courseId || (this.commonService.loginedUserInfo as any)?.selectedCourseId;
    if (!id) return;

    this.loading = true;
    const apiCall = this.questionnaireApiService.getQuestionsByCourse(id);
    apiCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const rawList = Array.isArray(response) ? response : (response?.data ?? []);
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
        next: (response: any) => {
          const raw = Array.isArray(response) ? response : (response?.data ?? []);
          if (raw.length === 0) return;
          this.hasSubmitted = true;
          const answerMap: Record<string, string | string[]> = {};
          raw.forEach((row: any) => {
            const qId = String(row.question_id ?? row.questionId ?? '');
            const answerStr = row.answer ?? '';
            if (!qId) return;
            try {
              const parsed = JSON.parse(answerStr);
              answerMap[qId] = Array.isArray(parsed) ? parsed : String(parsed);
            } catch {
              answerMap[qId] = answerStr;
            }
          });
          this.answers = { ...this.answers, ...answerMap };
        },
        error: () => {},
      });
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

    const answersPayload = this.questionsList.map((q, idx) => {
      const questionId = String(q.id ?? idx);
      const raw = this.answers[questionId];
      const answer = JSON.stringify(raw ?? '');
      return {
        course_id: this.courseId,
        question_id: questionId,
        answer,
        submitted_by: submittedBy,
      };
    });

    this.submitting = true;
    this.questionnaireApiService
      .submitAnswers(answersPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.hasSubmitted = true;
          this.commonService.openToaster({
            message: 'Answers submitted successfully!',
            messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
          });
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
