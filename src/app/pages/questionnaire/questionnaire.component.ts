import { Component } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { QuestionnaireApiService } from 'src/app/services/api-service/questionnaire-api.service';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonSearchProfileComponent],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss',
})
export class QuestionnaireComponent {
  private destroy$ = new Subject<void>();
  public questionsList: any = [];
  constructor(private questionnaireApiService: QuestionnaireApiService) {}
  ngOnInit() {
    this.questionnaireApiService
      .geAllQuestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((questionsList) => {
        this.questionsList = questionsList;
      });
  }
  seachTextHandler(searchText: string) {}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
