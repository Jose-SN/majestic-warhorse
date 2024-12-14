import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchFilter',
  standalone: true,
})
export class SearchFilterPipe implements PipeTransform {
  transform(
    searchList: any[],
    searchText: string,
    searchType: string,
    statusLevel?: string
  ): any[] {
    if (searchList.length) {
      return searchList.filter((searchItems) => {
        if (searchType === 'COURSE') {
          if (statusLevel && statusLevel !== 'All') {
            return (
              searchItems.courseTitle.toLowerCase().includes(searchText.toLowerCase()) &&
              searchItems.courseStatusLevel === statusLevel
            );
          } else {
            return searchItems.courseTitle.toLowerCase().includes(searchText.toLowerCase());
          }
        } else if (searchType === 'USER_LIST') {
          const fullName = `${searchItems.firstName} ${searchItems.lastName}`;
          return fullName.toLowerCase().includes(searchText.toLowerCase());
        }
      });
    }
    return [];
  }
}
