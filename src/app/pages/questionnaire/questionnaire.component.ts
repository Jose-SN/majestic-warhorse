import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { QuestionnaireApiService } from 'src/app/services/api-service/questionnaire-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ConfirmationPopupService } from 'src/app/shared/confirmation-popup/confirmation-popup.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { IQuestion, IQuestionCreate, IQuestionOption } from './model/question.model';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss',
})
export class QuestionnaireComponent implements OnInit {
  @Input() courseId: string = '';
  private destroy$ = new Subject<void>();
  public questionsList: IQuestion[] = [];
  public userRole: string = '';
  public isTeacher: boolean = false;
  public isStudent: boolean = false;

  // Teacher form fields - matches question table structure
  public newQuestion: Partial<IQuestion> & { options?: IQuestionOption[] } = {
    question: '',
    type: 'text',
    options: [],
  };
  public newOption = '';
  public editingOptionIndex: number | null = null;
  public editingOption = '';
  public editingQuestionId: string | null = null;
  public expandedQuestionId: string | null = null;

  // Student form answers
  public answers: any = {};

  constructor(
    private questionnaireApiService: QuestionnaireApiService,
    public commonService: CommonService,
    private confirmationPopupService: ConfirmationPopupService
  ) {}

  ngOnInit() {
    this.userRole = this.commonService?.loginedUserInfo?.role ?? '';
    this.isTeacher = this.userRole === 'teacher';
    this.isStudent = this.userRole === 'student';
    
    // Load questions for both teacher and student
    this.loadQuestions();
  }

  loadQuestions() {
    const apiCall = this.courseId
      ? this.questionnaireApiService.getQuestionsByCourse(this.courseId)
      : this.questionnaireApiService.geAllQuestions();
    apiCall.pipe(takeUntil(this.destroy$)).subscribe((questionsList) => {
      this.questionsList = questionsList ?? [];
        // Initialize answers object based on question type
        questionsList.forEach((question: any, index: number) => {
          const questionId = question.id || index;
          if (question.type === 'Checkbox') {
            this.answers[questionId] = [];
          } else {
            this.answers[questionId] = '';
          }
        });
      });
  }

  // Teacher methods
  addOption() {
    const text = (this.newOption || '').trim();
    if (!text) {
      this.confirmationPopupService.showAlert('Please enter an option');
      return;
    }
    if (!this.newQuestion.options) {
      this.newQuestion.options = [];
    }
    this.newQuestion.options!.push({
      label: text,
      value: text.replace(/\s/g, ''),
    });
    this.newOption = '';
  }

  removeOption(index: number) {
    this.newQuestion.options?.splice(index, 1);
    if (this.editingOptionIndex === index) {
      this.cancelEditOption();
    } else if (this.editingOptionIndex !== null && this.editingOptionIndex > index) {
      this.editingOptionIndex = this.editingOptionIndex - 1;
    }
  }

  editOption(index: number) {
    this.editingOptionIndex = index;
    const opts = this.newQuestion.options;
    this.editingOption = opts?.[index]?.label ?? '';
  }

  saveOption(index: number) {
    const text = (this.editingOption || '').trim();
    if (!text) {
      this.confirmationPopupService.showAlert('Please enter an option');
      return;
    }
    const opts = this.newQuestion.options;
    if (opts) opts[index] = { label: text, value: text.replace(/\s/g, '') };
    this.cancelEditOption();
  }

  cancelEditOption() {
    this.editingOptionIndex = null;
    this.editingOption = '';
  }

  editQuestion(question: IQuestion) {
    if (!question.id) return;
    this.editingQuestionId = question.id;
    this.newQuestion = {
      question: question.question ?? '',
      type: (question.type ?? 'text').toLowerCase(),
      options: question.options ? [...question.options] : [],
    };
    this.newOption = '';
    this.cancelEditOption();
    // Scroll to form
    document.querySelector('.questionnire-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEditQuestion() {
    this.editingQuestionId = null;
    this.resetQuestionForm();
  }

  toggleQuestionExpand(question: IQuestion) {
    const id = question.id ?? '';
    this.expandedQuestionId = this.expandedQuestionId === id ? null : id;
  }

  isQuestionExpanded(question: IQuestion): boolean {
    const id = question.id ?? '';
    return this.expandedQuestionId === id;
  }

  deleteQuestion(question: IQuestion) {
    if (!question.id) return;
    this.confirmationPopupService
      .showConfirm('Are you sure you want to delete this question?', 'Delete Question', 'Delete', 'Cancel')
      .then((confirmed) => {
        if (confirmed) {
          this.questionnaireApiService
            .deleteQuestion(question.id!)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.commonService.openToaster({
                  message: 'Question deleted successfully!',
                  messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
                });
                if (this.editingQuestionId === question.id) {
                  this.cancelEditQuestion();
                }
                if (this.expandedQuestionId === question.id) {
                  this.expandedQuestionId = null;
                }
                this.loadQuestions();
              },
              error: (error) => {
                console.error('Error deleting question:', error);
                this.commonService.openToaster({
                  message: 'Error deleting question. Please try again.',
                  messageType: TOASTER_MESSAGE_TYPE.ERROR,
                });
              },
            });
        }
      });
  }

  createQuestion() {
    if (!this.newQuestion.question) {
      this.confirmationPopupService.showAlert('Please enter a question');
      return;
    }

    // Validate options for Radio, Checkbox, and Dropdown
    const needsOptions = ['radio', 'checkbox', 'dropdown'].includes((this.newQuestion.type ?? '').toLowerCase());
    if (needsOptions && (!this.newQuestion.options || this.newQuestion.options.length === 0)) {
      this.confirmationPopupService.showAlert('Please add at least one option for this question type');
      return;
    }

    const courseId = this.courseId || (this.commonService.loginedUserInfo as any)?.selectedCourseId;
    const createdBy = this.commonService.loginedUserInfo?.id;
    if (!courseId || !createdBy) {
      this.confirmationPopupService.showAlert('Course context or user not found. Please open the questionnaire from a course.');
      return;
    }

    const typeMap: Record<string, string> = {
      text: 'Textbox',
      textarea: 'Textarea',
      radio: 'Radio',
      checkbox: 'Checkbox',
      dropdown: 'Dropdown',
    };
    const questionData: IQuestionCreate = {
      course_id: courseId as string,
      created_by: createdBy!,
      question: this.newQuestion.question,
      type: typeMap[this.newQuestion.type ?? 'text'] ?? 'Textbox',
      options: needsOptions ? (this.newQuestion.options ?? []) : [],
    };

    if (this.editingQuestionId) {
      this.questionnaireApiService
        .updateQuestion(this.editingQuestionId, questionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.commonService.openToaster({
              message: 'Question updated successfully!',
              messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
            });
            this.cancelEditQuestion();
            this.loadQuestions();
          },
          error: (error) => {
            console.error('Error updating question:', error);
            this.commonService.openToaster({
              message: 'Error updating question. Please try again.',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
          },
        });
    } else {
      this.questionnaireApiService
        .createQuestion(questionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.commonService.openToaster({
              message: 'Question created successfully!',
              messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
            });
            this.resetQuestionForm();
            this.loadQuestions();
          },
          error: (error) => {
            console.error('Error creating question:', error);
            this.commonService.openToaster({
              message: 'Error creating question. Please try again.',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
          },
        });
    }
  }

  resetQuestionForm() {
    this.editingQuestionId = null;
    this.newQuestion = {
      question: '',
      type: 'text',
      options: [],
    };
    this.newOption = '';
  }

  // Student methods
  handleCheckboxChange(questionId: any, optionValue: string, event: any) {
    const id = questionId;
    if (!this.answers[id] || !Array.isArray(this.answers[id])) {
      this.answers[id] = [];
    }
    if (event.target.checked) {
      if (!this.answers[id].includes(optionValue)) {
        this.answers[id].push(optionValue);
      }
    } else {
      this.answers[id] = this.answers[id].filter((val: string) => val !== optionValue);
    }
  }

  submitAnswers() {
    // Validate that all questions are answered
    const unansweredQuestions = this.questionsList.filter((question: IQuestion, index: number) => {
      const questionId = question.id ?? String(index);
      const answer = this.answers[questionId];
      if (question.type === 'Checkbox') {
        return !answer || !Array.isArray(answer) || answer.length === 0;
      }
      return !answer || answer === '';
    });

    if (unansweredQuestions.length > 0) {
      this.confirmationPopupService.showAlert(
        `Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`
      );
      return;
    }

    const answersData = {
      answers: this.answers,
      questions: this.questionsList
    };

    this.questionnaireApiService
      .submitAnswers(answersData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.confirmationPopupService.showAlert('Answers submitted successfully!', 'Success');
          // Optionally reset answers
          this.answers = {};
          this.loadQuestions();
        },
        error: (error) => {
          console.error('Error submitting answers:', error);
          this.confirmationPopupService.showAlert('Error submitting answers. Please try again.', 'Error');
        }
      });
  }

  /** Format question type for display (e.g. "text" -> "Textbox") */
  getQuestionTypeLabel(type?: string): string {
    const map: Record<string, string> = {
      text: 'Textbox',
      textarea: 'Textarea',
      radio: 'Radio',
      checkbox: 'Checkbox',
      dropdown: 'Dropdown',
      Textbox: 'Textbox',
      Textarea: 'Textarea',
      Radio: 'Radio',
      Checkbox: 'Checkbox',
      Dropdown: 'Dropdown',
    };
    return map[type ?? ''] ?? (type || 'Textbox');
  }

  seachTextHandler(searchText: string) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
