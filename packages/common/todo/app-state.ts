import type { SupportedView } from '../interfaces/shared-interfaces'

export type SortType =
  | 'default'
  | 'alphabetAsc'
  | 'alphabetAsc2'
  | 'alphabetDesc'
  | 'alphabetDesc2'
  | 'aspectRatioAsc'
  | 'aspectRatioDesc'
  | 'createdAsc'
  | 'createdDesc'
  | 'folderSizeAsc'
  | 'folderSizeDesc'
  | 'fpsAsc'
  | 'fpsDesc'
  | 'hash' // only used by the duplicateFinderPipe
  | 'lastPlayedAsc'
  | 'lastPlayedDesc'
  | 'modifiedAsc'
  | 'modifiedDesc'
  | 'random'
  | 'sizeAsc'
  | 'sizeDesc'
  | 'starAsc'
  | 'starDesc'
  | 'tagsAsc'
  | 'tagsDesc'
  | 'timeAsc'
  | 'timeDesc'
  | 'timesPlayedAsc'
  | 'timesPlayedDesc'
  | 'yearAsc'
  | 'yearDesc'

export type SupportedLanguage = 'en' | 'zh' | 'ja'

export interface RowNumbers {
  thumbnailSheet: number
  showThumbnails: number
  showFilmstrip: number
  showFullView: number
  showDetails: number
  showDetails2: number
  showClips: number
}

export const DefaultImagesPerRow: RowNumbers = {
  thumbnailSheet: 5,
  showThumbnails: 5,
  showFilmstrip: 5,
  showFullView: 5,
  showDetails: 4,
  showDetails2: 4,
  showClips: 4,
}

export const AppState: AppStateInterface = {
  // AppState is saved into `settings.json` so it persists
  addtionalExtensions: '',
  currentSort: 'default',
  currentVhaFile: '', // full path to the .vha2 file -- TODO: rename to `currentVhaFilePath` in VHA3
  currentView: 'showThumbnails',
  currentZoomLevel: 1,
  hubName: '',
  imgsPerRow: DefaultImagesPerRow,
  language: 'en',
  menuHidden: false,
  numOfFolders: 0,
  port: 3000,
  preferredVideoPlayer: '',
  selectedOutputFolder: '',
  sortTagsByFrequency: false,
  videoPlayerArgs: '',
}

export interface AppStateInterface {
  addtionalExtensions: string
  currentSort: SortType
  currentVhaFile: string
  currentView: SupportedView
  currentZoomLevel: number
  hubName: string
  imgsPerRow: RowNumbers
  language: SupportedLanguage
  menuHidden: boolean
  numOfFolders: number
  port: number
  preferredVideoPlayer: string
  selectedOutputFolder: string
  sortTagsByFrequency: boolean // when `false` sort tags alphabetically
  videoPlayerArgs: string
}
