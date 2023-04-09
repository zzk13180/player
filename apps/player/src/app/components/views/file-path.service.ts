import { Injectable } from '@angular/core'
import { SourceFolderService } from '../statistics/source-folder.service'
import type { ImageElement } from '@player/common/interfaces/final-object.interface'

type FolderType = 'thumbnails' | 'filmstrips' | 'clips'

@Injectable()
export class FilePathService {
  // eslint-disable-next-line no-useless-escape
  replaceMap: any = {
    ' ': '%20',
    '(': '%28',
    ')': '%29',
  }

  constructor(public sourceFolderService: SourceFolderService) {}

  createFilePath(
    folderPath: string,
    hubName: string,
    subfolder: FolderType,
    hash: string,
    video?: boolean,
  ): string {
    const res = `file://${folderPath}/vha-${hubName}/${subfolder}/${hash}${
      video ? '.mp4' : '.jpg'
    }`
    return res
  }

  /**
   * return file name without extension
   * e.g. `video.mp4` => `video`
   */
  getFileNameWithoutExtension(fileName: string): string {
    return fileName.slice().substr(0, fileName.lastIndexOf('.'))
  }

  /**
   * return extension without file name
   * e.g. `video.mp4` => `.mp4`
   */
  getFileNameExtension(fileName: string): string {
    return fileName.slice().split('.').pop()
  }

  /**
   * Return full filesystem path to video file
   */
  getPathFromImageElement(item: ImageElement): string {
    // const res = path.join(
    //   this.sourceFolderService.selectedSourceFolder[item.inputSource].path,
    //   item.partialPath,
    //   item.fileName,
    // )
    const res = `${
      this.sourceFolderService.selectedSourceFolder[item.inputSource].path
    }/${item.partialPath}/${item.fileName}`
    console.log(res)
    return res
  }
}
