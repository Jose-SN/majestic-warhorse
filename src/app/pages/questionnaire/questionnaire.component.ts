import { Component } from '@angular/core';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonSearchProfileComponent],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss'
})
export class QuestionnaireComponent {
  seachTextHandler(searchText:string){

  }
}
