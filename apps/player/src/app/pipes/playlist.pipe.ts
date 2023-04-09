import { Pipe } from '@angular/core'

import { PipeSideEffectService } from './pipe-side-effect.service'
import type { PipeTransform } from '@angular/core'

import type { ImageElement } from '@player/common/interfaces/final-object.interface'

@Pipe({
  name: 'playlistPipe',
})
export class PlaylistPipe implements PipeTransform {
  constructor(public pipeSideEffectService: PipeSideEffectService) {}

  /**
   * Return only items that match search string
   * @param finalArray
   */
  transform(finalArray: ImageElement[]): ImageElement[] {
    this.pipeSideEffectService.saveCurrentResults(finalArray)

    return finalArray
  }
}
