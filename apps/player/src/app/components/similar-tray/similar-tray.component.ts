import { Component, Input, EventEmitter, Output } from '@angular/core'

import { SourceFolderService } from '../statistics/source-folder.service'
import { modalAnimation, similarResultsText } from '../../animation/animations'
import { ImageElementService } from './../../services/image-element.service'

import type { RightClickEmit } from '@player/common/interfaces/shared-interfaces'
import type { SettingsButtonsType } from '@player/common/todo/settings-buttons'

@Component({
  selector: 'app-similar-tray',
  templateUrl: './similar-tray.component.html',
  styleUrls: ['../layout.scss', '../buttons.scss', './similar-tray.component.scss'],
  animations: [modalAnimation, similarResultsText],
})
export class SimilarTrayComponent {
  @Output() handleClick = new EventEmitter<any>() // todo: fix up the vague type
  @Output() rightMouseClicked = new EventEmitter<RightClickEmit>()

  @Input() appState
  @Input() currentClickedItemName
  @Input() previewHeightRelated
  @Input() previewWidthRelated
  @Input() settingsButtons: SettingsButtonsType
  @Input() showRecentNotSimilar

  constructor(
    public imageElementService: ImageElementService,
    public sourceFolderService: SourceFolderService,
  ) {}
}
