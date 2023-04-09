import type { AppStateInterface } from '../todo/app-state'
import type { SettingsButtonKey } from '../todo/settings-buttons'
import type { HistoryItem } from './shared-interfaces'
import type { WizardOptions } from './wizard-options.interface'

export type CustomShortcutAction =
  | 'focusOnFile'
  | 'focusOnMagic'
  | 'fuzzySearch'
  | 'quit'
  | 'showAutoTags'
  | 'showTagTray'
  | 'startWizard'
  | 'toggleMinimalMode'
  | 'toggleSettings'

export interface SettingsButtonSavedProperties {
  hidden: boolean
  toggled: boolean
}

export interface SettingsObject {
  appState: AppStateInterface
  buttonSettings: Record<SettingsButtonKey, SettingsButtonSavedProperties>
  remoteSettings: RemoteSettings
  shortcuts: Map<string, SettingsButtonKey | CustomShortcutAction>
  vhaFileHistory: HistoryItem[]
  wizardOptions: WizardOptions
}

export interface RemoteSettings {
  compactView: boolean
  darkMode: boolean
  imgsPerRow: number
  largerText: boolean
}
