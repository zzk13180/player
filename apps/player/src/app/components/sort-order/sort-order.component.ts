import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core'
import { filterItemAppear } from '../../animation/animations'
import type { ElementRef } from '@angular/core'

import type { SortType } from '@player/common/todo/app-state'
import type { SettingsButtonsType } from '@player/common/todo/settings-buttons'

@Component({
  selector: 'app-sort-order',
  templateUrl: './sort-order.component.html',
  styleUrls: ['../settings.scss', './sort-order.component.scss'],
  animations: [filterItemAppear],
})
export class SortOrderComponent {
  @ViewChild('sortFilterElement', { static: false }) sortFilterElement: ElementRef

  @Output() sortTypeChange = new EventEmitter<SortType>()

  @Input() settingsButtons: SettingsButtonsType

  constructor() {}
}
