import { Pipe } from '@angular/core'

import { Colors } from '@player/common/todo/colors'
import { autoFileTagsRegex } from './autotags.service'

import type { PipeTransform } from '@angular/core'
import type { ImageElement } from '@player/common/interfaces/final-object.interface'
import type { Tag } from '@player/common/interfaces/shared-interfaces'

@Pipe({
  name: 'tagDisplayPipe',
})
export class TagsDisplayPipe implements PipeTransform {
  transform(
    video: ImageElement,
    manualTags: boolean,
    autoFileTags: boolean,
    autoFolderTags: boolean,
    updateViewHack: boolean,
  ): Tag[] {
    const tags: Tag[] = []

    if (manualTags) {
      if (video.tags) {
        video.tags.sort().forEach(tag => {
          tags.push({
            name: tag,
            colour: Colors.manualTags,
            removable: true,
          })
        })
      }
    }

    if (autoFileTags) {
      const cleanedFileNameAsArray: string[] =
        video.cleanName.toLowerCase().match(autoFileTagsRegex) || []
      cleanedFileNameAsArray.forEach(word => {
        if (word.length >= 3) {
          // TODO - fix hardcoding ?
          tags.push({
            name: word,
            colour: Colors.autoFileTags,
            removable: false,
          })
        }
      })
    }

    if (autoFolderTags) {
      const cleanedFileName: string = video.partialPath.toLowerCase().replace('.', '')
      cleanedFileName.split('/').forEach(word => {
        if (word.length >= 3) {
          // TODO - fix hardcoding ?
          tags.push({
            name: word,
            colour: Colors.autoFolderTags,
            removable: false,
          })
        }
      })
    }

    return tags
  }
}
