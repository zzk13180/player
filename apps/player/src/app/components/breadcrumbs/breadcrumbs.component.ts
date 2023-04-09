import { Component, Input, Output, EventEmitter } from '@angular/core'
import { breadcrumbsAppear, breadcrumbWordAppear } from '../../animation/animations'
import type { SettingsButtonsType } from '@player/common/todo/settings-buttons'

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
  animations: [breadcrumbWordAppear, breadcrumbsAppear],
})
export class BreadcrumbsComponent {
  @Output() breadcrumbHomeIconClick = new EventEmitter<any>()
  @Output() handleBbreadcrumbClicked = new EventEmitter<number>()

  @Input() appState
  @Input() settingsButtons: SettingsButtonsType
  @Input() folderViewNavigationPath

  constructor() {}
}
