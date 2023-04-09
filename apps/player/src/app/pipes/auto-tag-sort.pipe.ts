import { Pipe } from '@angular/core'
import type { PipeTransform } from '@angular/core'

@Pipe({
  name: 'autoTagSortPipe',
})
export class AutoTagSortPipe implements PipeTransform {
  transform(allTags: string[], sort: boolean): string[] {
    if (sort) {
      let sortedTags: string[]
      sortedTags = allTags.sort((a, b) => (a['name'] < b['name'] ? -1 : 1))

      return sortedTags
    } else {
      return allTags
    }
  }
}
