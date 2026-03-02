import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { QuestionnaireApiService } from 'src/app/services/api-service/questionnaire-api.service';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonSearchProfileComponent, FormsModule, CommonModule],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss',
})
export class QuestionnaireComponent implements OnInit {
  private destroy$ = new Subject<void>();
  public questionsList: any = [];
  public userRole: string = '';
  public isTeacher: boolean = false;
  public isStudent: boolean = false;
  
  // Teacher form fields
  public newQuestion: any = {
    question: '',
    type: 'Textbox',
    options: []
  };
  public newOption: any = {
    label: '',
    value: ''
  };
  
  // Student form answers
  public answers: any = {};

  constructor(
    private questionnaireApiService: QuestionnaireApiService,
    public commonService: CommonService
  ) {}

  ngOnInit() {
    this.userRole = this.commonService?.loginedUserInfo?.role ?? '';
    this.isTeacher = this.userRole === 'teacher';
    this.isStudent = this.userRole === 'student';
    
    // Load questions for both teacher and student
    this.loadQuestions();
  }

  loadQuestions() {
    this.questionnaireApiService
      .geAllQuestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((questionsList) => {
        this.questionsList = questionsList;
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
    if (!this.newOption.label || !this.newOption.value) {
      alert('Please enter both label and value for the option');
      return;
    }
    if (!this.newQuestion.options) {
      this.newQuestion.options = [];
    }
    this.newQuestion.options.push({ ...this.newOption });
    this.newOption = { label: '', value: '' };
  }

  removeOption(index: number) {
    this.newQuestion.options.splice(index, 1);
  }

  createQuestion() {
    if (!this.newQuestion.question) {
      alert('Please enter a question');
      return;
    }

    // Validate options for Radio, Checkbox, and Dropdown
    const needsOptions = ['Radio', 'Checkbox', 'Dropdown'].includes(this.newQuestion.type);
    if (needsOptions && (!this.newQuestion.options || this.newQuestion.options.length === 0)) {
      alert('Please add at least one option for this question type');
      return;
    }

    const questionData = {
      ...this.newQuestion,
      minValue: this.newQuestion.minValue ? parseInt(this.newQuestion.minValue) : null,
      maxValue: this.newQuestion.maxValue ? parseInt(this.newQuestion.maxValue) : null,
      // Clear options for text input types
      options: needsOptions ? this.newQuestion.options : []
    };

    this.questionnaireApiService
      .createQuestion(questionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Reset form
          this.resetQuestionForm();
          // Reload questions
          this.loadQuestions();
        },
        error: (error) => {
          console.error('Error creating question:', error);
          alert('Error creating question. Please try again.');
        }
      });
  }

  resetQuestionForm() {
    this.newQuestion = {
      question: '',
      type: 'Textbox',
      options: []
    };
    this.newOption = { label: '', value: '' };
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
    const unansweredQuestions = this.questionsList.filter((question: any, index: number) => {
      const questionId = question.id || index;
      const answer = this.answers[questionId];
      if (question.type === 'Checkbox') {
        return !answer || !Array.isArray(answer) || answer.length === 0;
      }
      return !answer || answer === '';
    });

    if (unansweredQuestions.length > 0) {
      alert(`Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`);
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
          alert('Answers submitted successfully!');
          // Optionally reset answers
          this.answers = {};
          this.loadQuestions();
        },
        error: (error) => {
          console.error('Error submitting answers:', error);
          alert('Error submitting answers. Please try again.');
        }
      });
  }

  seachTextHandler(searchText: string) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
