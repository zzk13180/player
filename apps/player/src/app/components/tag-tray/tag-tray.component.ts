import { Component, Input, Output, EventEmitter } from '@angular/core'

import { ManualTagsService } from '../tags-manual/manual-tags.service'

import { modalAnimation } from '../../animation/animations'
import type { AppStateInterface } from '@player/common/todo/app-state'
import type { TagEmit } from '@player/common/interfaces/shared-interfaces'
import type { SettingsButtonsType } from '@player/common/todo/settings-buttons'

@Component({
  selector: 'app-tag-tray',
  templateUrl: './tag-tray.component.html',
  styleUrls: [
    '../layout.scss',
    '../settings.scss',
    '../search-input.scss',
    '../wizard-button.scss',
    './tag-tray.component.scss',
  ],
  animations: [modalAnimation],
})
export class TagTrayComponent {
  @Output() toggleBatchTaggingMode = new EventEmitter<any>()
  @Output() handleTagWordClicked = new EventEmitter<TagEmit>()
  @Output() selectAll = new EventEmitter<any>()

  @Input() appState: AppStateInterface
  @Input() batchTaggingMode
  @Input() darkMode: boolean
  @Input() settingsButtons: SettingsButtonsType

  manualTagFilterString = ''
  manualTagShowFrequency = true

  constructor(public manualTagsService: ManualTagsService) {}
}
