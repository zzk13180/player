/* eslint-disable */
import type { AfterViewInit, ElementRef, OnInit } from '@angular/core'
import { ChangeDetectorRef, NgZone } from '@angular/core'
import { Component, HostListener, ViewChild } from '@angular/core'
import { HttpClient } from '@angular/common/http'

import { BehaviorSubject } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { VirtualScrollerComponent } from 'ngx-virtual-scroller'

// Services
import { AutoTagsSaveService } from './tags-auto/tags-save.service'
import { ElectronService } from '../providers/electron.service'
import { FilePathService } from './views/file-path.service'
import { ImageElementService } from '../services/image-element.service'
import { ManualTagsService } from './tags-manual/manual-tags.service'
import { ModalService } from './modal/modal.service'
import { PipeSideEffectService } from '../pipes/pipe-side-effect.service'
import { ResolutionFilterService } from '../pipes/resolution-filter.service'
import { ShortcutsService } from './shortcuts/shortcuts.service'
import { SourceFolderService } from './statistics/source-folder.service'
import { StarFilterService } from '../pipes/star-filter.service'
import { WordFrequencyService, WordFreqAndHeight } from '../pipes/word-frequency.service'
import type { CustomShortcutAction } from '@player/common/interfaces/settings-object.interface'

// Components
import { SortOrderComponent } from './sort-order/sort-order.component'

// Interfaces
import type {
  FinalObject,
  ImageElement,
  ScreenshotSettings,
  ResolutionString,
} from '@player/common/interfaces/final-object.interface'

import type { ServerDetails } from './statistics/statistics.component'
import type {
  RemoteSettings,
  SettingsButtonSavedProperties,
  SettingsObject,
} from '@player/common/interfaces/settings-object.interface'
import type { SortType } from '@player/common/todo/app-state'
import type { WizardOptions } from '@player/common/interfaces/wizard-options.interface'
import type {
  HistoryItem,
  RemoteVideoClick,
  RenameFileResponse,
  SupportedTrayView,
  SupportedView,
  VideoClickEmit,
} from '@player/common/interfaces/shared-interfaces'
import {
  AllSupportedBottomTrayViews,
  AllSupportedViews,
} from '@player/common/interfaces/shared-interfaces'

// Constants, etc
import type { SupportedLanguage, RowNumbers } from '@player/common/todo/app-state'
import { AppState, DefaultImagesPerRow } from '@player/common/todo/app-state'
import { Filters, filterKeyToIndex, FilterKeyNames } from '@player/common/todo/filters'
import { LanguageLookup } from '@player/common/todo/languages'
import type {
  SettingsButtonKey,
  SettingsButtonsType,
} from '@player/common/todo/settings-buttons'
import {
  SettingsButtons,
  SettingsButtonsGroups,
} from '@player/common/todo/settings-buttons'

// Animations
import {
  bottomTrayAnimation,
  buttonAnimation,
  donutAppear,
  filterItemAppear,
  historyItemRemove,
  modalAnimation,
  myWizardAnimation,
  overlayAppear,
  rightClickAnimation,
  rightClickContentAnimation,
  similarResultsText,
  slowFadeIn,
  slowFadeOut,
  topAnimation,
} from '../animation/animations'

export type ImportStage = 'importingMeta' | 'importingScreenshots' | 'done'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: [
    './layout.scss',
    './settings.scss',
    './buttons.scss',
    './search.scss',
    './search-input.scss',
    './gallery.scss',
    './wizard-button.scss',
    './resolution.scss',
    './rightclick.scss',
  ],
  animations: [
    bottomTrayAnimation,
    buttonAnimation,
    donutAppear,
    filterItemAppear,
    historyItemRemove,
    modalAnimation,
    myWizardAnimation,
    overlayAppear,
    rightClickAnimation,
    rightClickContentAnimation,
    similarResultsText,
    slowFadeIn,
    slowFadeOut,
    topAnimation,
  ],
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('fuzzySearch', { static: false }) fuzzySearch: ElementRef
  @ViewChild('magicSearch', { static: false }) magicSearch: ElementRef
  @ViewChild('searchRef', { static: false }) searchRef: ElementRef

  @ViewChild(SortOrderComponent) sortOrderRef: SortOrderComponent

  @ViewChild(VirtualScrollerComponent, { static: false })
  virtualScroller: VirtualScrollerComponent

  defaultSettingsButtons = JSON.parse(JSON.stringify(SettingsButtons))
  settingsButtons: SettingsButtonsType = SettingsButtons
  settingsButtonsGroups = SettingsButtonsGroups
  settingTabToShow = 0

  filters = Filters

  // App state to save -- so it can be exported and saved when closing the app
  appState = AppState

  demo = false
  macVersion = 'macVersion'
  versionNumber = 'versionNumber'

  vhaFileHistory: HistoryItem[] = []

  windowResizeTimeout = null

  newVideoImportTimeout = null
  newVideoImportCounter = 0

  // ========================================================================
  // App state / UI state
  // ------------------------------------------------------------------------

  isClosing = false
  appMaximized = false
  settingsModalOpen = false
  flickerReduceOverlay = true
  isFirstRunEver = false

  // ========================================================================
  // Import / extraction progress
  // ------------------------------------------------------------------------

  extractionPercent = 1
  importStage: ImportStage = 'done'
  progressString = ''

  // ========================================================================
  // Gallery thumbnails
  // ------------------------------------------------------------------------

  currentImgsPerRow = 5
  galleryWidth: number
  imgsPerRow: RowNumbers = DefaultImagesPerRow
  previewHeight = 144
  previewHeightRelated = 144 // For the Related Videos tab:
  previewWidth: number
  previewWidthRelated: number // For the Related Videos tab:
  textPaddingHeight: number // for text padding below filmstrip or thumbnail element

  // ========================================================================
  // Duration filter
  // ------------------------------------------------------------------------

  durationLeftBound = 0
  durationOutlierCutoff = 0
  durationRightBound = Infinity

  // ========================================================================
  // Size filter
  // ------------------------------------------------------------------------

  sizeLeftBound = 0
  sizeOutlierCutoff = 0
  sizeRightBound = Infinity

  // ========================================================================
  // Times Played filter
  // ------------------------------------------------------------------------

  timesPlayedCutoff = 0
  timesPlayedLeftBound = 0
  timesPlayedRightBound = Infinity

  // ========================================================================
  // Year filter
  // ------------------------------------------------------------------------

  yearMinCutoff = 0
  yearCutoff = 0
  yearLeftBound = 0
  yearRightBound = Infinity

  // ========================================================================
  // Frequency / histogram
  // ------------------------------------------------------------------------

  resolutionFreqArr: number[]
  freqLeftBound = 0
  freqRightBound = 4
  resolutionNames: ResolutionString[] = ['SD', '720', '1080', '4K']

  // ========================================================================
  // Star filter
  // ------------------------------------------------------------------------

  starRatingFreqArr: number[]
  starLeftBound = 0
  starRightBound = 6
  starRatingNames: string[] = ['N/A', '1', '2', '3', '4', '5']

  // ========================================================================
  // Right-click / Renaming functionality
  // ------------------------------------------------------------------------

  currentRightClickedItem: ImageElement
  renamingExtension: string
  renamingNow = false
  rightClickPosition: { x: number; y: number } = { x: 0, y: 0 }
  rightClickShowing = false

  // ========================================================================
  // Thumbnail Sheet Overlay Display
  // ------------------------------------------------------------------------

  sheetItemToDisplay: ImageElement
  sheetOverlayShowing = false

  // ========================================================================
  // Variables for the wizard during import
  // ------------------------------------------------------------------------

  canCloseWizard = false

  wizard: WizardOptions = {
    clipHeight: 144,
    clipSnippetLength: 1,
    clipSnippets: 3,
    extractClips: false,
    futureHubName: '',
    isFixedNumberOfScreenshots: true,
    screenshotSizeForImport: 288,
    selectedOutputFolder: '',
    selectedSourceFolder: { 0: { path: '', watch: false } },
    showWizard: false,
    ssConstant: 10,
    ssVariable: 5,
  }

  // ========================================================================
  // currently only used for the statistics page
  // && to prevent clip view from showing when no clips extracted
  // defaults set here ONLY because when starting the app in clip view
  // the app would show error in console log:
  //   `Cannot read property 'clipSnippets' of undefined`
  // ------------------------------------------------------------------------

  currentScreenshotSettings: ScreenshotSettings = {
    clipHeight: 144,
    clipSnippetLength: 1,
    clipSnippets: 0,
    fixed: true,
    height: 432,
    n: 3,
  }

  // ========================================================================
  // Miscellaneous variables
  // ------------------------------------------------------------------------

  currentClickedItem: ImageElement
  currentClickedItemName = ''
  currentPlayingFolder = ''
  fullPathToCurrentFile = ''

  fuzzySearchString = ''
  magicSearchString = ''
  regexSearchString = ''
  regexError = false // handle pipe-side-effect BehaviorSubject

  wordFreqArr: WordFreqAndHeight[]
  numberOfVideosFound: number // after applying all search filters

  findMostSimilar: string // for finding similar files to this one
  showSimilar = false // to toggle the similarity pipe

  shuffleTheViewNow = 0 // dummy number to force re-shuffle current view

  sortType: SortType = 'default'

  timeExtractionStarted // time remaining calculator
  timeExtractionRemaining // time remaining calculator

  deletePipeHack = false // to force deletePipe to update

  folderNavigationScrollOffset = 0 // when in folder view and returning back to root
  folderViewNavigationPath = ''

  batchTaggingMode = false // when batch tagging is enabled

  latestVersionAvailable: string

  tagTypeAhead = ''

  allFinishedScanning = true

  lastRenamedFileHack: ImageElement

  remoteSettings: RemoteSettings

  // Behavior Subjects for IPC events:

  inputSorceChosenBehaviorSubject: BehaviorSubject<string> = new BehaviorSubject(
    undefined,
  )
  numberScreenshotsDeletedBehaviorSubject: BehaviorSubject<number> = new BehaviorSubject(
    undefined,
  )
  oldFolderReconnectedBehaviorSubject: BehaviorSubject<{ source: number; path: string }> =
    new BehaviorSubject(undefined)
  renameFileResponseBehaviorSubject: BehaviorSubject<RenameFileResponse> =
    new BehaviorSubject(undefined)
  serverDetailsBehaviorSubject: BehaviorSubject<ServerDetails> = new BehaviorSubject(
    undefined,
  )

  // ========================================================================
  // \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
  // ========================================================================

  // Listen for key presses
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // .metaKey is for mac `command` button
    if (event.ctrlKey === true || event.metaKey) {
      const key: string = event.key

      if (this.shortcutService.keyToActionMap.has(key)) {
        const shortcutAction: SettingsButtonKey | CustomShortcutAction =
          this.shortcutService.keyToActionMap.get(key)

        if (
          this.shortcutService.regularShortcuts.includes(
            shortcutAction as SettingsButtonKey,
          )
        ) {
          this.toggleButton(shortcutAction as SettingsButtonKey)
        } else {
          this.handleCustomShortcutAction(event, shortcutAction as CustomShortcutAction)
        }
      }
    } else if (
      event.key === 'Escape' &&
      this.wizard.showWizard === true &&
      this.canCloseWizard === true
    ) {
      this.wizard.showWizard = false
    } else if (event.key === 'Escape' && this.settingsModalOpen) {
      this.settingsModalOpen = false
    } else if (
      event.key === 'Escape' &&
      (this.rightClickShowing || this.renamingNow || this.sheetOverlayShowing)
    ) {
      this.rightClickShowing = false
      this.renamingNow = false
      this.sheetOverlayShowing = false
    } else if (event.key === 'Escape' && this.settingsButtons['showTags'].toggled) {
      this.toggleButton('showTags')
    }
  }

  @HostListener('window:resize')
  handleResizeEvent() {
    this.debounceUpdateMax()
  }

  constructor(
    private http: HttpClient,
    public autoTagsSaveService: AutoTagsSaveService,
    public cd: ChangeDetectorRef,
    public electronService: ElectronService,
    public filePathService: FilePathService,
    public imageElementService: ImageElementService,
    public manualTagsService: ManualTagsService,
    public modalService: ModalService,
    public pipeSideEffectService: PipeSideEffectService,
    public resolutionFilterService: ResolutionFilterService,
    public shortcutService: ShortcutsService,
    public sourceFolderService: SourceFolderService,
    public starFilterService: StarFilterService,
    public translate: TranslateService,
    public wordFrequencyService: WordFrequencyService,
    public zone: NgZone,
  ) {}

  ngOnInit() {
    this.translate.setDefaultLang('zh')
    this.changeLanguage('zh')

    this.wordFrequencyService.finalMapBehaviorSubject.subscribe(
      (value: WordFreqAndHeight[]) => {
        this.wordFreqArr = value
      },
    )
    this.resolutionFilterService.finalResolutionMapBehaviorSubject.subscribe(value => {
      this.resolutionFreqArr = value
      this.cd.detectChanges() // prevent `ExpressionChangedAfterItHasBeenCheckedError`
    })
    this.starFilterService.finalStarMapBehaviorSubject.subscribe(value => {
      this.starRatingFreqArr = value
      this.cd.detectChanges() // prevent `ExpressionChangedAfterItHasBeenCheckedError`
    })
    this.pipeSideEffectService.searchResults.subscribe((value: number) => {
      this.numberOfVideosFound = value
      this.cd.detectChanges() // prevent `ExpressionChangedAfterItHasBeenCheckedError`
    })
    this.pipeSideEffectService.regexError.subscribe((value: boolean) => {
      this.regexError = value
    })

    /////////////////////////////////////////////
    this.vhaFileHistory = []
    // mock data
    const settingsObject = {
      appState: {
        addtionalExtensions: '',
        currentSort: 'alphabetDesc',
        currentVhaFile: 'C:\\Users\\zzk13\\Desktop\\videos\\videos.vha2',
        currentView: 'showThumbnails',
        currentZoomLevel: 1,
        hubName: 'videos',
        imgsPerRow: {
          thumbnailSheet: 5,
          showThumbnails: 5,
          showFilmstrip: 5,
          showFullView: 5,
          showDetails: 4,
          showDetails2: 4,
          showClips: 4,
          showFiles: 5,
        },
        language: 'zh',
        menuHidden: false,
        numOfFolders: 1,
        port: 3000,
        preferredVideoPlayer: '',
        selectedOutputFolder: 'C:/Users/zzk13/Desktop/videos',
        sortTagsByFrequency: false,
        videoPlayerArgs: '',
      },
      buttonSettings: {
        hideSidebar: { toggled: false, hidden: false },
        folderUnion: { toggled: false, hidden: true },
        folderIntersection: { toggled: false, hidden: false },
        folderExclusion: { toggled: false, hidden: true },
        fileUnion: { toggled: false, hidden: true },
        fileIntersection: { toggled: true, hidden: false },
        exclude: { toggled: false, hidden: true },
        tagUnion: { toggled: false, hidden: true },
        tagIntersection: { toggled: true, hidden: true },
        tagExclusion: { toggled: false, hidden: true },
        videoNotes: { toggled: false, hidden: true },
        magic: { toggled: true, hidden: false },
        regex: { toggled: false, hidden: true },
        fuzzy: { toggled: true, hidden: false },
        durationFilter: { toggled: false, hidden: false },
        sizeFilter: { toggled: false, hidden: false },
        timesPlayedFilter: { toggled: false, hidden: false },
        resolutionFilter: { toggled: false, hidden: false },
        yearFilter: { toggled: false, hidden: false },
        starFilter: { toggled: false, hidden: false },
        sortOrder: { toggled: false, hidden: false },
        hideOffline: { toggled: false, hidden: true },
        sortOptionAlphabetical: { toggled: true, hidden: false },
        sortOptionAlphabetical2: { toggled: false, hidden: false },
        sortOptionTime: { toggled: true, hidden: false },
        sortOptionSize: { toggled: true, hidden: false },
        sortOptionTimesPlayed: { toggled: false, hidden: false },
        sortOptionLastPlayed: { toggled: false, hidden: false },
        sortOptionStar: { toggled: false, hidden: false },
        sortOptionYear: { toggled: false, hidden: false },
        sortOptionModified: { toggled: true, hidden: false },
        sortOptionCreated: { toggled: false, hidden: false },
        sortOptionTags: { toggled: false, hidden: false },
        sortOptionAspectRatio: { toggled: false, hidden: false },
        sortOptionFps: { toggled: false, hidden: false },
        sortOptionFolderSize: { toggled: false, hidden: false },
        duplicateLength: { toggled: false, hidden: true },
        duplicateSize: { toggled: false, hidden: true },
        duplicateHash: { toggled: false, hidden: true },
        showRecent: { toggled: false, hidden: false },
        showThumbnails: { toggled: true, hidden: false },
        showFilmstrip: { toggled: false, hidden: false },
        showFullView: { toggled: false, hidden: false },
        showDetails: { toggled: false, hidden: false },
        showDetails2: { toggled: false, hidden: false },
        showFiles: { toggled: false, hidden: false },
        showClips: { toggled: false, hidden: false },
        showFolders: { toggled: false, hidden: false },
        randomizeFoldersScreenshots: { toggled: true, hidden: true },
        showTags: { toggled: false, hidden: false },
        showFreq: { toggled: false, hidden: false },
        showTagTray: { toggled: false, hidden: true },
        showRelatedVideosTray: { toggled: false, hidden: false },
        showRecentlyPlayed: { toggled: false, hidden: false },
        showDetailsTray: { toggled: false, hidden: false },
        compactView: { toggled: false, hidden: false },
        showMoreInfo: { toggled: false, hidden: false },
        fontSizeLarger: { toggled: false, hidden: true },
        shuffleGalleryNow: { toggled: false, hidden: false },
        manualTags: { toggled: true, hidden: true },
        autoFileTags: { toggled: true, hidden: true },
        autoFolderTags: { toggled: false, hidden: true },
        showVideoNotes: { toggled: false, hidden: true },
        sortAutoTags: { toggled: false, hidden: true },
        favorites: { toggled: false, hidden: false },
        hoverScrub: { toggled: true, hidden: true },
        thumbAutoAdvance: { toggled: false, hidden: true },
        returnToFirstScreenshot: { toggled: true, hidden: true },
        muteClips: { toggled: true, hidden: true },
        autoplayClips: { toggled: false, hidden: true },
        clipsThumbnail: { toggled: false, hidden: true },
        makeSmaller: { toggled: false, hidden: false },
        makeLarger: { toggled: false, hidden: false },
        darkMode: { toggled: false, hidden: false },
        doubleClickMode: { toggled: false, hidden: true },
        dragVideoOutOfApp: { toggled: false, hidden: true },
        hideTop: { toggled: false, hidden: false },
        flatIcons: { toggled: false, hidden: false },
        startWizard: { toggled: false, hidden: false },
        resetSettings: { toggled: false, hidden: false },
        clearHistory: { toggled: false, hidden: false },
        showDeleteOption: { toggled: false, hidden: true },
        dangerousDelete: { toggled: false, hidden: true },
        playPlaylist: { toggled: false, hidden: true },
        openAtTimestamp: { toggled: false, hidden: true },
      },
      shortcuts: {
        '1': 'showThumbnails',
        '2': 'showFilmstrip',
        '3': 'showFullView',
        '4': 'showDetails',
        '5': 'showDetails2',
        '6': 'showFiles',
        '7': 'showClips',
        b: 'hideSidebar',
        d: 'darkMode',
        f: 'focusOnFile',
        g: 'focusOnMagic',
        i: 'showMoreInfo',
        k: 'toggleMinimalMode',
        l: 'compactView',
        n: 'startWizard',
        o: 'toggleSettings',
        q: 'quit',
        r: 'fuzzySearch',
        s: 'shuffleGalleryNow',
        t: 'showAutoTags',
        w: 'quit',
        x: 'makeLarger',
        y: 'showTagTray',
        z: 'makeSmaller',
      },
      vhaFileHistory: [
        {
          vhaFilePath: 'C:\\Users\\zzk13\\Desktop\\videos\\videos.vha2',
          hubName: 'videos',
        },
      ],
      wizardOptions: {
        clipHeight: 144,
        clipSnippetLength: 1,
        clipSnippets: 3,
        extractClips: false,
        futureHubName: 'videos',
        isFixedNumberOfScreenshots: true,
        screenshotSizeForImport: 288,
        selectedOutputFolder: 'C:\\Users\\zzk13\\Desktop\\videos',
        selectedSourceFolder: {
          '0': { path: 'C:\\Users\\zzk13\\Desktop\\videos', watch: false },
        },
        showWizard: false,
        ssConstant: 5,
        ssVariable: 5,
      },
    }

    const finalObject = {
      addTags: [],
      hubName: 'videos',
      images: [
        {
          birthtime: 1680589167121,
          bitrate: 0.06,
          cleanName: '51 1 新出語彙',
          duration: 246,
          fileName: '51_1_新出語彙.mp4',
          fileSize: 14664368,
          fps: 25,
          hash: 'ae9d6584f0ed838501d473087c7e4981',
          height: 360,
          inputSource: 0,
          lastPlayed: 1680703773489,
          mtime: 1680590352264,
          partialPath: '/',
          screens: 5,
          stars: 0.5,
          timesPlayed: 7,
          width: 640,
          year: 1896,
          durationDisplay: '04:06',
          fileSizeDisplay: '15 MB',
          resBucket: 0.5,
          resolution: '',
          index: 0,
        },
        {
          birthtime: 1680589164471,
          bitrate: 0.06,
          cleanName: '51 2 文型',
          duration: 2125,
          fileName: '51_2_文型.mp4',
          fileSize: 126498800,
          fps: 25,
          hash: 'cb9765a9f52bf28ec23a96d3cd12d16e',
          height: 360,
          inputSource: 0,
          lastPlayed: 1680703417082,
          mtime: 1680594142787,
          partialPath: '/',
          screens: 5,
          stars: 0.5,
          timesPlayed: 1,
          width: 640,
          durationDisplay: '35:25',
          fileSizeDisplay: '126 MB',
          resBucket: 0.5,
          resolution: '',
          index: 1,
        },
        {
          birthtime: 1680589164144,
          bitrate: 0.06,
          cleanName: '51 3 会話',
          duration: 353,
          fileName: '51_3_会話.mp4',
          fileSize: 21007864,
          fps: 25,
          hash: '0e36a38a9888f0b10fae325e963febc2',
          height: 360,
          inputSource: 0,
          lastPlayed: 1680744794372,
          mtime: 1680589936562,
          partialPath: '/',
          screens: 5,
          stars: 0.5,
          timesPlayed: 2,
          width: 640,
          durationDisplay: '05:53',
          fileSizeDisplay: '21 MB',
          resBucket: 0.5,
          resolution: '',
          index: 2,
        },
        {
          birthtime: 1680589163056,
          bitrate: 0.06,
          cleanName: '51 4 練習',
          duration: 1343,
          fileName: '51_4_練習.mp4',
          fileSize: 79764632,
          fps: 25,
          hash: 'c1414d9dfa85189ccdadd2226616140a',
          height: 360,
          inputSource: 0,
          lastPlayed: 0,
          mtime: 1680590894153,
          partialPath: '/',
          screens: 5,
          stars: 0.5,
          timesPlayed: 0,
          width: 640,
          durationDisplay: '22:23',
          fileSizeDisplay: '80 MB',
          resBucket: 0.5,
          resolution: '',
          index: 3,
        },
      ],
      inputDirs: { '0': { path: 'C:\\Users\\zzk13\\Desktop\\videos', watch: false } },
      numOfFolders: 1,
      removeTags: [],
      screenshotSettings: {
        clipHeight: 144,
        clipSnippetLength: 1,
        clipSnippets: 0,
        fixed: true,
        height: 288,
        n: 5,
      },
      version: 3,
    }

    const pathToFile = `C:\Users\zzk13\Desktop\videos\videos.vha2`
    const outputFolderPath = `C:/Users/zzk13/Desktop/videos`
    this.stopServer()

    this.currentClickedItem = undefined
    this.lastRenamedFileHack = undefined
    this.imageElementService.finalArrayNeedsSaving = false
    this.imageElementService.recentlyPlayed = []

    this.currentScreenshotSettings = finalObject.screenshotSettings as any

    this.appState.currentVhaFile = pathToFile
    this.appState.selectedOutputFolder = outputFolderPath

    this.appState.hubName = finalObject.hubName
    this.appState.numOfFolders = finalObject.numOfFolders

    this.sourceFolderService.selectedSourceFolder = finalObject.inputDirs
    this.sourceFolderService.resetConnected()

    // Update history of opened files
    this.updateVhaFileHistory(pathToFile, finalObject.hubName)

    this.folderViewNavigationPath = ''

    this.manualTagsService.removeAllTags()
    this.setTags(finalObject.addTags, finalObject.removeTags)
    this.manualTagsService.populateManualTagsService(finalObject.images as any)

    this.imageElementService.imageElements = finalObject.images as any //  this.demo ? finalObject.images.slice(0, 50) : finalObject.images;

    this.canCloseWizard = true
    this.wizard.showWizard = false
    this.flickerReduceOverlay = false

    this.setUpDurationFilterValues(this.imageElementService.imageElements)
    this.setUpSizeFilterValues(this.imageElementService.imageElements)
    this.setUpTimesPlayedFilterValues(this.imageElementService.imageElements)
    this.setUpYearFilterValues(this.imageElementService.imageElements)

    if (this.sortOrderRef.sortFilterElement) {
      this.sortOrderRef.sortFilterElement.nativeElement.value = this.sortType
    }

    this.cd.detectChanges()

    this.loadThisVhaFile(settingsObject.appState.currentVhaFile)
    this.shortcutService.initializeFromSaved(settingsObject.shortcuts)
  }

  // =======================================================================================================================================
  // =======================================================================================================================================
  // =======================================================================================================================================

  ngAfterViewInit() {
    this.computePreviewWidth() // so that fullView knows its size // TODO -- check if still needed!

    // this is required, otherwise when user drops the file, it opens as plaintext
    document.ondragover = document.ondrop = ev => {
      ev.preventDefault()
    }
    // document.body.ondrop = ev => {
    //   if (ev.dataTransfer.files.length > 0) {
    //     const fullPath: string = ev.dataTransfer.files[0].path
    //     ev.preventDefault()
    //     if (fullPath.endsWith('.vha2')) {
    //       this.loadThisVhaFile(fullPath)
    //     }
    //   }
    // }
  }

  /**
   * Migrate VHA meta properties from one ImageElement to another
   * @param destination
   * @param origin
   */
  copyMetaProperties(destination: ImageElement, origin: ImageElement): void {
    // WARNING - some day in MacOS we'll add OS tags, so this will need to be a merge, not replace
    destination.notes = origin.notes
    destination.stars = origin.stars
    destination.tags = origin.tags
    destination.timesPlayed = origin.timesPlayed
    destination.year = origin.year
  }

  /**
   * Tell Electron to drag a file out of the app into the system
   * Used for dragging videos into video editors like Vgeas and Premiere
   */
  draggingVideoFile(event, item: ImageElement): void {
    // event.preventDefault()
    // const fullPath = this.filePathService.getPathFromImageElement(item)
    // const imgPath = 'TODO'
    //  path.join(
    //   this.appState.selectedOutputFolder,
    //   'vha-' + this.appState.hubName,
    //   'thumbnails',
    //   item.hash + '.jpg',
    // )
    console.log('send⭐ drag-video-out-of-electron')
  }

  /**
   * Only update the view after enough changes occurred
   * - update after every new element when < 20 elements total
   * - update every 20 new elements after until 100; every 100 thereafter
   * - update at most 3 seconds after the last element arrived
   */
  public debounceImport(): void {
    this.newVideoImportCounter++

    clearTimeout(this.newVideoImportTimeout)

    if (
      this.imageElementService.imageElements.length < 20 ||
      (this.imageElementService.imageElements.length < 100 &&
        this.newVideoImportCounter === 20) ||
      this.newVideoImportCounter === 100
    ) {
      this.resetFinalArrayRef()
    } else {
      this.newVideoImportTimeout = setTimeout(() => {
        this.resetFinalArrayRef()
      }, 3000)
    }
  }

  /**
   * Helper method only to be used by `debounceImport()`
   */
  private resetFinalArrayRef(): void {
    this.newVideoImportCounter = 0
    this.imageElementService.imageElements =
      this.imageElementService.imageElements.slice()
    this.cd.detectChanges()
  }

  /**
   * Delete from finalArray all the video files with particular source index
   * @param sourceIndex
   */
  deleteInputSourceFiles(sourceIndex: number): void {
    this.imageElementService.imageElements.forEach((element: ImageElement) => {
      // tslint:disable-next-line:triple-equals
      if (element.inputSource == sourceIndex) {
        // TODO -- stop the loosey goosey `==` and figure out `string` vs `number`
        element.deleted = true
        this.imageElementService.finalArrayNeedsSaving = true
      }
    })
    this.deletePipeHack = !this.deletePipeHack
  }

  /**
   * Handle dropping something over an item in the gallery
   * Used to handle dropping a .jpg file to replace preview!
   * @param event         drop event - containing path to possible jpg file
   * @param galleryItem   item in the gallery over which jpg was dropped
   */
  droppedSomethingOverVideo(event, galleryItem: ImageElement) {
    // this occurs when a tag is dropped on a video from the tag tray
    if (event.dataTransfer.getData('text')) {
      // tag previously set by `dragStart` in `view-tags.component`
      const tag: string = event.dataTransfer.getData('text')

      this.addTagToThisElement(tag, galleryItem)

      this.ifShowDetailsViewRefreshTags()

      return
    }

    const pathToNewImage: string = event.dataTransfer.files[0].path.toLowerCase()
    if (
      (pathToNewImage.endsWith('.jpg') ||
        pathToNewImage.endsWith('.jpeg') ||
        pathToNewImage.endsWith('.png')) &&
      galleryItem.cleanName !== '*FOLDER*'
    ) {
      console.log('⭐ replace-thumbnail', pathToNewImage, galleryItem)
    }
  }

  /**
   * Low-tech debounced window resize
   * @param msDelay - number of milliseconds to debounce; if absent sets to 250ms
   */
  public debounceUpdateMax(msDelay?: number): void {
    // console.log('debouncing');
    const delay = msDelay !== undefined ? msDelay : 250
    clearTimeout(this.windowResizeTimeout)
    this.windowResizeTimeout = setTimeout(() => {
      // console.log('Virtual scroll refreshed');
      this.virtualScroller.refresh()
      this.computePreviewWidth()
    }, delay)
  }

  /**
   * Summon a dialog to open a default video player
   */
  public chooseDefaultVideoPlayer(): void {
    console.log('send⭐ select-default-video-player')
  }

  // ---------------- INTERACT WITH ELECTRON ------------------ //

  /**
   * Send initial `hello` message
   * triggers function that grabs settings and sends them back with `settings-returning`
   */
  public justStarted(): void {
    console.log('send⭐ just-started')
  }

  public loadThisVhaFile(fullPath: string): void {
    console.log('send⭐load-this-vha-file', fullPath, this.getFinalObjectForSaving())
  }

  public loadFromFile(): void {
    console.log('send⭐ system-open-file-through-modal')
  }

  public selectSourceDirectory(): void {
    console.log('send⭐ choose-input')
  }

  public selectOutputDirectory(): void {
    console.log('send⭐ choose-output')
  }

  public importFresh(): void {
    this.sourceFolderService.selectedSourceFolder = this.wizard.selectedSourceFolder
    this.appState.selectedOutputFolder = this.wizard.selectedOutputFolder
    console.log('send⭐ start-the-import', this.wizard)
  }

  public cancelCurrentImport(): void {
    console.log('send⭐ cancel-current-import')
    setTimeout(() => {
      this.importStage = 'done'
      this.cd.detectChanges()
    }, 10) // just in case delay
  }

  public initiateMinimize(): void {
    console.log('send⭐ minimize-window')
  }

  public initiateMaximize(): void {
    if (this.appMaximized) {
      console.log('send⭐ un-maximize-window')
      this.appMaximized = false
    } else {
      console.log('send⭐ maximize-window')
      this.appMaximized = true
    }
  }

  public initiateClose(): void {
    this.isClosing = true
    this.savePreviousViewSize()
    this.appState.imgsPerRow = this.imgsPerRow
    console.log(
      'send⭐ close-window',
      this.getSettingsForSave(),
      this.getFinalObjectForSaving(),
    )
  }

  /**
   * Returns the finalArray if needed, otherwise returns `null`
   * completely depends on global variable `finalArrayNeedsSaving` or if any tags were added/removed in auto-tag-service
   */
  public getFinalObjectForSaving(): FinalObject {
    if (
      this.imageElementService.finalArrayNeedsSaving ||
      this.autoTagsSaveService.needToSave()
    ) {
      const propsToReturn: FinalObject = {
        addTags: this.autoTagsSaveService.getAddTags(),
        hubName: this.appState.hubName,
        images: this.imageElementService.imageElements,
        // TODO -- rename `selectedSourceFolder` and make sure to update `finalArrayNeedsSaving` when inputDirs changes
        inputDirs: this.sourceFolderService.selectedSourceFolder,
        numOfFolders: this.appState.numOfFolders,
        removeTags: this.autoTagsSaveService.getRemoveTags(),
        screenshotSettings: this.currentScreenshotSettings,
        version: 3,
      }
      return propsToReturn
    } else {
      return null
    }
  }

  /**
   * Handle clicking on an item in the gallery
   *
   * @param eventObject - VideoClickEmit
   * @param item        - ImageElement
   * @param doubleClick - boolean -- happens only on `app-file-item` -- added as a quick hack
   */
  public handleClick(
    eventObject: VideoClickEmit,
    item: ImageElement,
    doubleClick?: boolean,
  ) {
    console.log(item)

    if (this.batchTaggingMode) {
      item.selected = !item.selected

      return
    }

    if (
      this.settingsButtons.doubleClickMode.toggled &&
      !(eventObject.doubleClick || doubleClick)
    ) {
      // when double-clicking, this runs twice anyway
      this.assignSelectedFile(item)

      return
    }

    // ctrl/cmd + click for thumbnail sheet
    if (eventObject.mouseEvent.ctrlKey === true || eventObject.mouseEvent.metaKey) {
      this.openThumbnailSheet(item)
    } else {
      this.openVideo(item, eventObject.thumbIndex)
      //  `openVideo` method handles the `not connected` case
    }
  }

  /**
   * Open the video with user's default media player
   * or with their preferred media player, if chosen
   *
   * @param item                  clicked ImageElement
   * @param clickedThumbnailIndex an index of the thumbnail clicked
   */
  public openVideo(item: ImageElement, clickedThumbnailIndex?: number): void {
    console.log('TODO⭐ openVideo')
  }

  /**
   * handle right-click and `Open folder`
   */
  openContainingFolderNow(): void {
    // 'TODO'
    // this.fullPathToCurrentFile = this.filePathService.getPathFromImageElement(
    //   this.currentRightClickedItem,
    // )
    // this.openInExplorer()
  }

  /**
   * Determine the required arguments to open video player at particular time
   * @param playerPath  full path to user's preferred video player
   * @param time        time in seconds
   */
  public getVideoPlayerArgs(playerPath: string, time: number): string {
    // if user doesn't want to open at timestamp, don't!
    let args = ''

    if (this.settingsButtons['openAtTimestamp'].toggled) {
      if (playerPath.toLowerCase().includes('vlc')) {
        args = '--start-time=' + time.toString() // in seconds
      } else if (playerPath.toLowerCase().includes('mpc')) {
        args = '/start ' + (1000 * time).toString() // in milliseconds
      } else if (playerPath.toLowerCase().includes('pot')) {
        args = '/seek=' + time.toString() // in seconds
      } else if (playerPath.toLowerCase().includes('mpv')) {
        args = '--start=' + time.toString() // in seconds
      }
    }

    return args
  }

  public openOnlineHelp(): void {
    console.log('send⭐ please-open-url', '')
  }

  public increaseZoomLevel(): void {
    if (this.appState.currentZoomLevel < 2.5) {
      this.appState.currentZoomLevel = this.appState.currentZoomLevel + 0.1
      console.log('⭐ increasing zoom level')
    }
  }

  public decreaseZoomLevel(): void {
    if (this.appState.currentZoomLevel > 0.6) {
      this.appState.currentZoomLevel = this.appState.currentZoomLevel - 0.1
      console.log('⭐ decreasing zoom level')
    }
  }

  public resetZoomLevel(): void {
    if (this.appState.currentZoomLevel !== 1) {
      this.appState.currentZoomLevel = 1
      console.log('⭐ resetting zoom level')
    }
  }

  // -----------------------------------------------------------------------------------------------

  /**
   * Add filter to tag search when word in word cloud or tag tray is clicked
   * @param filter - particular tag clicked
   */
  handleTagWordClicked(filter: string, event?): void {
    if (this.batchTaggingMode) {
      this.addTagToManyVideos(filter)
      return
    }

    if (
      // if all tags disabled, perform a FILE search
      !this.settingsButtons['manualTags'].toggled &&
      !this.settingsButtons['autoFileTags'].toggled &&
      !this.settingsButtons['autoFolderTags'].toggled
    ) {
      this.handleFileWordClicked(filter, event)
      return
    }

    this.showSidebar()
    if (event && event.shiftKey) {
      // Shift click to exclude tag!
      if (!this.settingsButtons['tagExclusion'].toggled) {
        this.settingsButtons['tagExclusion'].toggled = true
      }
      this.onEnterKey(filter, 8) // 8th item is the `tagExclusion` filter in `FilterKeyNames`
    } else {
      if (!this.settingsButtons['tagIntersection'].toggled) {
        this.settingsButtons['tagIntersection'].toggled = true
      }
      this.onEnterKey(filter, 7) // 7th item is the `tagIntersection` filter in `FilterKeyNames`
    }
  }

  /**
   * Add filter to FILE search when word in file is clicked
   * @param filter
   */
  handleFileWordClicked(filter: string, event?): void {
    this.showSidebar()
    if (event && event.shiftKey) {
      // Shift click to exclude tag!
      if (!this.settingsButtons['exclude'].toggled) {
        this.settingsButtons['exclude'].toggled = true
      }
      this.onEnterKey(filter, 5) // 5th item is the `exclude` filter in `FilterKeyNames`
    } else {
      if (!this.settingsButtons['fileIntersection'].toggled) {
        this.settingsButtons['fileIntersection'].toggled = true
      }
      this.onEnterKey(filter, 4) // 4th item is the `fileIntersection` filter in `FilterKeyNames`
    }
  }

  /**
   * Add filter to FOLDER search when word in folder is clicked
   * @param filter
   */
  handleFolderWordClicked(filter: string, event?): void {
    this.showSidebar()
    if (event && event.shiftKey) {
      // Shift click to exclude tag!
      if (!this.settingsButtons['folderExclusion'].toggled) {
        this.settingsButtons['folderExclusion'].toggled = true
      }
      this.onEnterKey(filter, 2) // 2nd item is the `folderExclusion` filter in `FilterKeyNames`
    } else {
      if (!this.settingsButtons['folderIntersection'].toggled) {
        this.settingsButtons['folderIntersection'].toggled = true
      }
      this.onEnterKey(filter, 1) // 1st item is the `folder` filter
    }
  }
  /**
   * Handle clicking on FOLDER in gallery, or the folder icon in breadcrumbs, or the `UP` folder
   * @param filter
   */
  handleFolderIconClicked(filter: string): void {
    if (this.folderNavigationScrollOffset === 0) {
      this.folderNavigationScrollOffset =
        this.virtualScroller.viewPortInfo.scrollStartPosition
    }

    this.folderViewNavigationPath = filter

    this.scrollAppropriately(filter)
  }

  /**
   * Handle clicking on a particular breadcrumb
   * @param idx is roughly index of the folder depth clicked
   */
  handleBbreadcrumbClicked(idx: number): void {
    this.folderViewNavigationPath = this.folderViewNavigationPath
      .split('/')
      .slice(0, idx + 1)
      .join('/')
    this.scrollToTop()
  }

  /**
   * Scroll appropriately after navigating back to root folder
   *
   * Rather hacky thing, but works in the basic case
   * Fails if user enters folder, changes some search or sort filter, and navigates back
   */
  scrollAppropriately(filter: string) {
    if (filter === '') {
      setTimeout(() => {
        this.virtualScroller.scrollToPosition(this.folderNavigationScrollOffset, 0)
        this.folderNavigationScrollOffset = 0
      }, 1)
    } else {
      this.scrollToTop()
    }
  }

  /**
   * Go back to root and scroll to last-seen location
   */
  breadcrumbHomeIconClick(): void {
    this.folderViewNavigationPath = ''
    this.scrollAppropriately('')
  }

  /**
   * Open folder that contains the (current) clicked file
   */
  openInExplorer(): void {
    console.log('send⭐ open-in-explorer', this.fullPathToCurrentFile)
  }

  /**
   * Show sidebar if it's closed
   */
  showSidebar(): void {
    if (this.settingsButtons['hideSidebar'].toggled) {
      this.toggleButton('hideSidebar')
      this.computePreviewWidth()
    }
  }

  // -----------------------------------------------------------------------------------------------
  // Interaction functions

  /**
   * Add this file to the recently opened list
   * @param file full path to file name
   */
  updateVhaFileHistory(pathToVhaFile: string, hubName: string): void {
    const newHistoryItem = {
      vhaFilePath: pathToVhaFile,
      hubName: hubName || 'untitled',
    }

    let matchFound = false

    ;(this.vhaFileHistory || []).forEach((element: any, index: number) => {
      if (element.vhaFilePath === pathToVhaFile) {
        matchFound = true
        // remove from current position
        this.vhaFileHistory.splice(index, 1)
        this.vhaFileHistory.splice(0, 0, newHistoryItem)
      }
    })

    if (!matchFound) {
      this.vhaFileHistory.unshift(newHistoryItem)
    }
  }

  /**
   * Handle click from html to open a recently-opened VHA file
   * @param index - index of the file from `vhaFileHistory`
   */
  openFromHistory(index: number): void {
    this.loadThisVhaFile(this.vhaFileHistory[index].vhaFilePath)
  }

  /**
   * Handle click from html to open a recently-opened VHA file
   * @param index - index of the file from `vhaFileHistory`
   */
  removeFromHistory(index: number): void {
    this.vhaFileHistory.splice(index, 1)
  }

  /**
   * Clear out the recently-viewed history
   */
  clearRecentlyViewedHistory(): void {
    this.vhaFileHistory = []
    console.log('send⭐ clear-recent-documents')
  }

  /**
   * Show or hide settings
   */
  toggleSettings(): void {
    this.settingTabToShow = 2
    this.settingsModalOpen = !this.settingsModalOpen
  }

  hideWizard(): void {
    this.wizard.showWizard = false
  }

  /**
   * Handle auto-generated tag clicked: add it to file search filter
   * @param event
   */
  autoTagClicked(event: string): void {
    this.handleFileWordClicked(event)
    this.toggleButton('showTags') // close the modal
  }

  /**
   * Toggles all views buttons off
   * A helper function for `toggleBotton`
   */
  toggleAllViewsButtonsOff(): void {
    this.settingsButtons['showClips'].toggled = false
    this.settingsButtons['showDetails'].toggled = false
    this.settingsButtons['showDetails2'].toggled = false
    this.settingsButtons['showFiles'].toggled = false
    this.settingsButtons['showFilmstrip'].toggled = false
    this.settingsButtons['showFullView'].toggled = false
    this.settingsButtons['showThumbnails'].toggled = false
  }

  /**
   * Toggles all TRAY views buttons off
   * A helper function for `toggleBotton`
   */
  toggleAllTrayViewsButtonsOff(): void {
    this.settingsButtons['showDetailsTray'].toggled = false
    this.settingsButtons['showFreq'].toggled = false
    this.settingsButtons['showRecentlyPlayed'].toggled = false
    this.settingsButtons['showRelatedVideosTray'].toggled = false
    this.settingsButtons['showTagTray'].toggled = false
  }

  /**
   * Helper method for `toggleButton` to set `toggled` boolean true
   * @param uniqueKey
   */
  toggleButtonTrue(uniqueKey: string): void {
    this.settingsButtons[uniqueKey].toggled = true
  }

  /**
   * Helper method for `toggleButton` to set `toggled` boolean to its opposite
   * @param uniqueKey
   */
  toggleButtonOpposite(uniqueKey: string): void {
    this.settingsButtons[uniqueKey].toggled = !this.settingsButtons[uniqueKey].toggled
  }

  /**
   * Save the current view image size
   */
  savePreviousViewSize(): void {
    this.imgsPerRow[this.appState.currentView] = this.currentImgsPerRow
  }

  /**
   * Restore the image height for the particular view
   */
  restoreViewSize(view: string): void {
    this.currentImgsPerRow = this.imgsPerRow[view] || 5 // showDetails2 view does not exist when upgrading to 2.2.3
  }

  /**
   * Handle custom shortcut action
   * summoned via `handleKeyboardEvent`
   * @param event - keyboard event
   * @param shortcutAction - CustomShortcutAction
   */
  handleCustomShortcutAction(
    event: KeyboardEvent,
    shortcutAction: CustomShortcutAction,
  ): void {
    switch (shortcutAction) {
      case 'toggleSettings':
        if (this.wizard.showWizard === false) {
          this.toggleSettings()
        }
        break

      case 'showAutoTags':
        if (!this.wizard.showWizard) {
          this.toggleButton('showTags')
        }
        break

      case 'showTagTray':
        if (!this.wizard.showWizard) {
          this.toggleButton('showTagTray')
        }
        break

      case 'quit':
        event.preventDefault()
        event.stopPropagation()
        this.initiateClose()
        break

      case 'startWizard':
        this.startWizard()
        this.settingsModalOpen = false
        this.settingsButtons['showTags'].toggled = false
        break

      case 'toggleMinimalMode':
        this.toggleButton('hideTop')
        this.toggleButton('hideSidebar')
        this.toggleButtonOff('showTagTray')
        this.toggleRibbon()
        this.toggleButton('showMoreInfo')
        break

      case 'focusOnFile':
        if (this.settingsButtons['fileIntersection'].toggled === false) {
          this.settingsButtons['fileIntersection'].toggled = true
        }
        this.showSidebar()
        setTimeout(() => {
          if (this.searchRef.nativeElement.querySelector('#fileIntersection')) {
            this.searchRef.nativeElement.querySelector('#fileIntersection').focus()
          }
        }, 1)
        break

      case 'focusOnMagic':
        if (!this.settingsButtons['magic'].toggled) {
          this.settingsButtons['magic'].toggled = true
        }
        this.showSidebar()
        setTimeout(() => {
          this.magicSearch.nativeElement.focus()
        }, 1)
        break

      case 'fuzzySearch':
        if (!this.settingsButtons['fuzzy'].toggled) {
          this.settingsButtons['fuzzy'].toggled = true
        }
        this.showSidebar()
        setTimeout(() => {
          this.fuzzySearch.nativeElement.focus()
        }, 1)
        break
    }
  }

  /**
   * Perform appropriate action when a button is clicked
   * @param   uniqueKey   the uniqueKey string of the button
   * @param   fromIpc     boolean value indicate, call from IPC
   */
  toggleButton(
    uniqueKey: SettingsButtonKey | SupportedView | SupportedTrayView,
    fromIpc = false,
  ): void {
    // ======== View buttons ================
    if (AllSupportedViews.includes(<SupportedView>uniqueKey)) {
      this.savePreviousViewSize()
      this.toggleAllViewsButtonsOff()
      this.toggleButtonTrue(uniqueKey)
      this.restoreViewSize(uniqueKey)
      this.appState.currentView = <SupportedView>uniqueKey
      this.computeTextBufferAmount()
      this.virtualScroller.invalidateAllCachedMeasurements()
      this.scrollToTop()

      // ======== Bottom tray views buttons =========================
    } else if (AllSupportedBottomTrayViews.includes(<SupportedTrayView>uniqueKey)) {
      const stateBeforeClick: boolean = this.settingsButtons[uniqueKey].toggled
      this.toggleAllTrayViewsButtonsOff()
      if (this.batchTaggingMode) {
        this.toggleBatchTaggingMode()
      }
      this.settingsButtons[uniqueKey].toggled = !stateBeforeClick

      if (
        (uniqueKey === 'showRelatedVideosTray' &&
          this.settingsButtons['showRelatedVideosTray'].toggled) ||
        (uniqueKey === 'showRecentlyPlayed' &&
          this.settingsButtons['showRecentlyPlayed'].toggled)
      ) {
        this.computePreviewWidth()
      }
      this.cd.detectChanges()

      // ======== Filter buttons =========================
    } else if (FilterKeyNames.includes(uniqueKey)) {
      this.filters[filterKeyToIndex[uniqueKey]].array = []
      this.filters[filterKeyToIndex[uniqueKey]].bool =
        !this.filters[filterKeyToIndex[uniqueKey]].bool
      this.toggleButtonOpposite(uniqueKey)
    } else if (uniqueKey === 'magic') {
      this.magicSearchString = ''
      this.toggleButtonOpposite(uniqueKey)
    } else if (uniqueKey === 'fuzzy') {
      this.fuzzySearchString = ''
      this.toggleButtonOpposite(uniqueKey)

      // ======== Other buttons ========================
    } else if (uniqueKey === 'compactView') {
      this.toggleButtonOpposite(uniqueKey)
      this.virtualScroller.refresh()
      if (
        this.settingsButtons['showThumbnails'].toggled ||
        this.settingsButtons['showClips'].toggled ||
        this.settingsButtons['showFilmstrip'].toggled
      ) {
        this.computeTextBufferAmount()
      }
    } else if (uniqueKey === 'showFolders') {
      this.toggleButtonOpposite('showFolders')
      if (!this.settingsButtons['showFolders'].toggled) {
        this.folderViewNavigationPath = ''
      }
      this.scrollToTop()
    } else if (uniqueKey === 'makeSmaller') {
      this.decreaseSize()
    } else if (uniqueKey === 'makeLarger') {
      this.increaseSize()
    } else if (uniqueKey === 'startWizard') {
      this.startWizard()
    } else if (uniqueKey === 'clearHistory') {
      this.clearRecentlyViewedHistory()
    } else if (uniqueKey === 'resetSettings') {
      this.resetSettingsToDefault()
    } else if (uniqueKey === 'showTags') {
      if (this.settingsModalOpen) {
        this.settingsModalOpen = false
      }
      this.toggleButtonOpposite('showTags')
    } else if (uniqueKey === 'playPlaylist') {
      const execPath: string = this.appState.preferredVideoPlayer
      console.log(
        'send⭐ please-create-playlist',
        this.pipeSideEffectService.galleryShowing,
        this.sourceFolderService.selectedSourceFolder,
        execPath,
      )
    } else if (uniqueKey === 'sortOrder') {
      this.toggleButtonOpposite(uniqueKey)
      setTimeout(() => {
        if (this.sortOrderRef.sortFilterElement) {
          // just in case, perform check
          this.sortOrderRef.sortFilterElement.nativeElement.value = this.sortType
        }
      })
    } else if (uniqueKey === 'shuffleGalleryNow') {
      this.sortType = 'random'
      this.shuffleTheViewNow++
      this.scrollToTop()
      // if sort filter is NOT showin on the sidebar, enable
      if (!this.sortOrderRef.sortFilterElement) {
        this.settingsButtons['sortOrder'].toggled = true
      }
      // and set the setting-option to `Random' after timeout to update view
      setTimeout(() => {
        if (this.sortOrderRef.sortFilterElement) {
          // just in case, perform check
          this.sortOrderRef.sortFilterElement.nativeElement.value = 'random'
        }
      })
    } else {
      this.toggleButtonOpposite(uniqueKey)
      if (uniqueKey === 'showMoreInfo') {
        this.computeTextBufferAmount()
      }
      if (uniqueKey === 'hideSidebar') {
        setTimeout(() => {
          this.virtualScroller.refresh()
          this.computePreviewWidth()
        }, 300)
      }
    }
    if (!fromIpc) {
      console.log('send⭐ app-to-touchBar', uniqueKey)
    } else {
      this.cd.detectChanges()
    }
  }

  public toggleButtonOff(
    uniqueKey: SettingsButtonKey | SupportedView | SupportedTrayView,
  ): void {
    if (this.settingsButtons[uniqueKey].toggled) {
      this.settingsButtons[uniqueKey].toggled = false
    }
  }

  /**
   * scroll to the top of the gallery
   */
  public scrollToTop(): void {
    document.getElementById('scrollDiv').scrollTop = 0
  }

  /**
   * Start the wizard again
   */
  public startWizard(): void {
    this.wizard = {
      clipHeight: 144, // default = half the screenshot height
      clipSnippetLength: 1,
      clipSnippets: 5,
      extractClips: false,
      futureHubName: '',
      isFixedNumberOfScreenshots: this.wizard.isFixedNumberOfScreenshots ?? true,
      screenshotSizeForImport: this.wizard.screenshotSizeForImport ?? 288, // default
      selectedOutputFolder: '',
      selectedSourceFolder: { 0: { path: '', watch: false } },
      showWizard: true,
      ssConstant: this.wizard.ssConstant ?? 10,
      ssVariable: this.wizard.ssVariable ?? 5,
    }
    this.toggleSettings()
  }

  // ==========================================================================================
  // Methods for RESCAN
  // ==========================================================================================

  /**
   * Decrease preview size
   */
  public decreaseSize(): void {
    if (this.appState.currentView === 'showFiles') {
      return
    }
    this.currentImgsPerRow++
    this.computePreviewWidth()
    this.virtualScroller.invalidateAllCachedMeasurements()
  }

  /**
   * Increase preview size
   */
  public increaseSize(): void {
    if (this.appState.currentView === 'showFiles') {
      return
    }
    if (this.appState.currentView === 'showDetails') {
      if (this.currentImgsPerRow > 2) {
        this.currentImgsPerRow--
      }
    } else if (this.appState.currentView === 'showDetails2') {
      if (this.currentImgsPerRow > 3) {
        this.currentImgsPerRow--
      }
    } else if (this.currentImgsPerRow > 1) {
      this.currentImgsPerRow--
    }
    this.computePreviewWidth()
    this.virtualScroller.invalidateAllCachedMeasurements()
  }

  /**
   * Computes the preview width for thumbnails view
   */
  public computePreviewWidth(): void {
    // Subtract 14 -- it is a bit more than the scrollbar on the right
    this.galleryWidth =
      document.getElementById('scrollDiv').getBoundingClientRect().width - 14

    if (
      this.appState.currentView === 'showClips' ||
      this.appState.currentView === 'showThumbnails' ||
      this.appState.currentView === 'showDetails' ||
      this.appState.currentView === 'showDetails2'
    ) {
      const margin: number = this.settingsButtons['compactView'].toggled ? 4 : 40
      this.previewWidth = this.galleryWidth / this.currentImgsPerRow - margin
    } else if (
      this.appState.currentView === 'showFilmstrip' ||
      this.appState.currentView === 'showFullView'
    ) {
      this.previewWidth = (this.galleryWidth - 30) / this.currentImgsPerRow
    }

    this.previewHeight = this.previewWidth * (9 / 16)

    // compute preview dimensions for thumbs in the most similar tab:
    if (
      this.settingsButtons['showRelatedVideosTray'].toggled ||
      this.settingsButtons['showRecentlyPlayed'].toggled
    ) {
      this.previewWidthRelated = Math.min(this.galleryWidth / 5 - 40, 176)
      this.previewHeightRelated = Math.min(this.previewWidthRelated * (9 / 16), 144)
    }
  }

  /**
   * Compute the number of pixels needed to add to the preview item
   * Thumbnails need more space for the text
   * Filmstrip needs less
   */
  public computeTextBufferAmount(): void {
    this.computePreviewWidth()

    switch (this.appState.currentView) {
      case 'showThumbnails':
        if (this.settingsButtons.compactView.toggled) {
          this.textPaddingHeight = 0
        } else if (this.settingsButtons.showMoreInfo.toggled) {
          this.textPaddingHeight = 55
        } else {
          this.textPaddingHeight = 20
        }
        break

      case 'showFilmstrip':
        if (this.settingsButtons.compactView.toggled) {
          this.textPaddingHeight = 0
        } else if (this.settingsButtons.showMoreInfo.toggled) {
          this.textPaddingHeight = 20
        } else {
          this.textPaddingHeight = 0
        }
        break

      case 'showFiles':
        this.textPaddingHeight = 20
        break

      case 'showClips':
        if (this.settingsButtons.compactView.toggled) {
          this.textPaddingHeight = 0
        } else if (this.settingsButtons.showMoreInfo.toggled) {
          this.textPaddingHeight = 55
        } else {
          this.textPaddingHeight = 20
        }
        break

      // default case not needed
    }
  }

  /**
   * Add search string to filter array
   * When user presses the `ENTER` key
   * @param value  -- the string to filter
   * @param origin -- number in filter array of the filter to target
   */
  onEnterKey(value: string, origin: number): void {
    const trimmed = value.trim()

    if (origin === 6) {
      // the `tags include` search
      this.tagTypeAhead = ''
    }

    if (trimmed) {
      // don't include duplicates
      if (!this.filters[origin].array.includes(trimmed)) {
        this.filters[origin].array.push(trimmed)
        this.filters[origin].bool = !this.filters[origin].bool
        this.filters[origin].string = ''
        this.scrollToTop()
      }
    }
  }

  /**
   * Removes last-added filter
   * When user presses the `BACKSPACE` key
   * @param origin  -- array from which to .pop()
   */
  onBackspace(value: string, origin: number): void {
    if (value === '' && this.filters[origin].array.length > 0) {
      this.filters[origin].array.pop()
      this.filters[origin].bool = !this.filters[origin].bool
    }
  }

  /**
   * Removes item from particular search array
   * When user clicks on a particular search word
   * @param item    {number}  index within array of search strings
   * @param origin  {number}  index within filters array
   */
  removeThisFilter(item: number, origin: number): void {
    this.filters[origin].array.splice(item, 1)
    this.filters[origin].bool = !this.filters[origin].bool
  }

  /**
   * Toggle the visibility of the settings button
   * @param item  -- index within the searchButtons array to toggle
   */
  toggleHideButton(item: string): void {
    this.settingsButtons[item].hidden = !this.settingsButtons[item].hidden
  }

  /**
   * Show or hide the ribbon
   */
  toggleRibbon(): void {
    this.appState.menuHidden = !this.appState.menuHidden
  }

  // ---- HANDLE EXTRACTING AND RESTORING SETTINGS ON OPEN AND BEFORE CLOSE ------

  /**
   * Prepare and return the settings object for saving
   * happens right before closing the app !!!
   */
  getSettingsForSave(): SettingsObject {
    const buttonSettings = {} as Record<SettingsButtonKey, SettingsButtonSavedProperties>

    this.grabAllSettingsKeys().forEach((key: SettingsButtonKey) => {
      buttonSettings[key] = {
        toggled: this.settingsButtons[key].toggled,
        hidden: this.settingsButtons[key].hidden,
      } as SettingsButtonSavedProperties
    })

    return {
      appState: this.appState,
      buttonSettings: buttonSettings,
      remoteSettings: this.remoteSettings,
      shortcuts: this.shortcutService.keyToActionMap,
      vhaFileHistory: this.vhaFileHistory,
      wizardOptions: this.wizard,
    }
  }

  /**
   * Return all keys from the settings-buttons
   */
  grabAllSettingsKeys(): SettingsButtonKey[] {
    const objectKeys: SettingsButtonKey[] = []

    this.settingsButtonsGroups.forEach(element => {
      element.forEach(key => {
        objectKeys.push(key)
      })
    })

    // console.log(objectKeys);
    return objectKeys
  }

  /**
   * Restore settings to their default values
   */
  resetSettingsToDefault(): void {
    this.settingsButtons = JSON.parse(JSON.stringify(this.defaultSettingsButtons)) // JSON hack to allow resetting more than once
    this.toggleButton('showThumbnails')
  }

  /**
   * restore settings from saved file
   */
  restoreSettingsFromBefore(settingsObject: SettingsObject): void {
    if (settingsObject.appState) {
      this.appState = settingsObject.appState
      if (!settingsObject.appState.currentZoomLevel) {
        // catch error <-- old VHA apps didn't have `currentZoomLevel`
        this.appState.currentZoomLevel = 1 // TODO -- remove whole block -- not needed any more !?!?!?!??!?! -----------------!
      }
      if (!settingsObject.appState.imgsPerRow) {
        this.appState.imgsPerRow = DefaultImagesPerRow
      }
    }
    this.sortType = this.appState.currentSort
    this.imgsPerRow = this.appState.imgsPerRow
    this.currentImgsPerRow = this.imgsPerRow[this.appState.currentView]
    this.grabAllSettingsKeys().forEach(element => {
      if (settingsObject.buttonSettings[element]) {
        this.settingsButtons[element].toggled =
          settingsObject.buttonSettings[element].toggled
        this.settingsButtons[element].hidden =
          settingsObject.buttonSettings[element].hidden
        // retrieving state of buttons for touchBar
        if (this.settingsButtons[element].toggled) {
          console.log('send⭐ app-to-touchBar', element)
        }
      }
    })
    this.computeTextBufferAmount()

    this.settingsButtons['showTags'].toggled = false // never show tags on load (they don't load right anyway)

    if (this.settingsButtons['showTagTray'].toggled) {
      this.settingsButtons['showTagTray'].toggled = false
      setTimeout(() => {
        this.settingsButtons['showTagTray'].toggled = true // needs a delay to show up correctly
      }, 100)
    }
  }

  /**
   * Restore the language from settings or try to set it from the user's locale
   * @param storedSetting the `language` attribute in AppState
   * @param locale the string that comes from `app.getLocale()`
   * List of locales is here: https://github.com/electron/electron/blob/master/docs/api/locales.md
   */
  setOrRestoreLanguage(chosenLanguage: SupportedLanguage, locale: string): void {
    if (chosenLanguage) {
      this.changeLanguage(chosenLanguage)
    } else if (<any>locale.substring(0, 2)) {
      this.changeLanguage(<any>locale.substring(0, 2))
    } else {
      this.changeLanguage('zh')
    }
  }

  /**
   * Update the min and max resolution for the resolution filter
   * @param selection
   */
  newResFilterSelected(selection: number[]): void {
    this.freqLeftBound = selection[0]
    this.freqRightBound = selection[1]
  }

  /**
   * Update the min and max star rating for the star filter
   * @param selection
   */
  newStarFilterSelected(selection: number[]): void {
    this.starLeftBound = selection[0]
    this.starRightBound = selection[1]
  }

  /**
   * Handle right-click and `Show similar`
   */
  showSimilarNow(): void {
    this.findMostSimilar = this.currentRightClickedItem.cleanName
    // console.log(this.findMostSimilar);
    this.showSimilar = true
  }

  /**
   * Handle right-click on file and `view folder`
   */
  showOnlyThisFolderNow(): void {
    this.handleFolderWordClicked(this.currentRightClickedItem.partialPath)
  }

  rightMouseClicked(event: MouseEvent, item: ImageElement): void {
    this.currentRightClickedItem = item

    const winWidth: number = window.innerWidth
    const clientX: number = event.clientX
    const howFarFromRight: number = winWidth - clientX

    // handle top-offset if clicking close to the bottom
    const winHeight: number = window.innerHeight
    const clientY: number = event.clientY
    const howFarFromBottom: number = winHeight - clientY

    this.rightClickPosition.x =
      howFarFromRight < 150 ? clientX - 150 + howFarFromRight : clientX
    this.rightClickPosition.y =
      howFarFromBottom < 210 ? clientY - 210 + howFarFromBottom : clientY

    this.rightClickShowing = true
  }

  /**
   * When in double-click mode and a video is clicked - `currentClickedItemName` updated
   * @param item
   */
  assignSelectedFile(item: ImageElement): void {
    this.currentClickedItemName = item.cleanName
    this.updateCurrentClickedItem(item)
  }

  /**
   * If the `showDetailsTray` is open, update the `currentClickedItem`
   * @param item
   */
  updateCurrentClickedItem(item: ImageElement): void {
    // to update the view, we must first destroy the component with `null` since component sets thumbnail at `ngOnInit`
    this.currentClickedItem = null
    setTimeout(() => {
      this.currentClickedItem = item
    })
  }

  /**
   * Opens the thumbnail sheet for the selected video
   */
  openThumbnailSheet(item: ImageElement): void {
    this.sheetItemToDisplay = item
    this.sheetOverlayShowing = true
  }

  /**
   * Deletes a file (moves to recycling bin / trash) or dangerously deletes (bypassing trash)
   */
  deleteThisFile(item: ImageElement): void {
    const base: string =
      this.sourceFolderService.selectedSourceFolder[item.inputSource].path
    const dangerously: boolean = this.settingsButtons['dangerousDelete'].toggled
    console.log('send⭐ delete-video-file', base, item, dangerously)
  }

  /**
   * Close the rename dialog
   */
  closeRename() {
    this.renamingNow = false
    this.cd.detectChanges()
  }

  /**
   * For ternary in `home.component` template when right-clicking on folder instead of file
   */
  doNothing(): void {
    // do nothing
  }

  /**
   * Add and remove tags from the AutoTagsSaveService
   * triggered on vha file load
   * @param addTags
   * @param removeTags
   */
  setTags(addTags: string[], removeTags: string[]): void {
    this.autoTagsSaveService.restoreSavedTags(
      addTags ? addTags : [],
      removeTags ? removeTags : [],
    )
  }

  /**
   * Change the language via ngx-translate
   * `en` is the default
   * @param language
   */
  changeLanguage(language: SupportedLanguage): void {
    this.translate.use(language)
    this.translate.setTranslation(language, LanguageLookup[language])
    this.appState.language = language

    this.updateSystemMessages()
  }

  /**
   * Update the systemMessages `main.ts`
   * so that ... i18n everywhere!
   */
  updateSystemMessages() {
    const newMessages = {}

    for (const key in LanguageLookup['zh'].SYSTEM) {
      if (LanguageLookup['zh'].SYSTEM[key]) {
        newMessages[key] = this.translate.instant('SYSTEM.' + key)
      }
    }

    console.log('send⭐ system-messages-updated', newMessages)
  }

  /**
   * Run when user starts the app for the first time
   * Gets triggered when the settings.json is missing from the app folder
   */
  firstRunLogic(): void {
    console.log('WELCOME')
    console.log('this is the first time you are running this app')
    this.isFirstRunEver = true
  }

  /**
   * Select a particular sort order (star rating, number of times played, etc)
   * @param type
   */
  selectFilterOrder(type: SortType): void {
    this.sortType = type
    this.appState.currentSort = type
  }

  /**
   * Check type-ahead for the manually-added tags!
   * @param text     input text to check type-ahead
   * @param compute  whether or not to perform the lookup
   */
  checkTagTypeahead(text: string) {
    this.tagTypeAhead = this.manualTagsService.getTypeahead(text)
  }

  /**
   * Add tag to search when pressing tab
   * !!! but only when on the tag search field !!!
   * @param origin -- the `j` in the template, just pass it on to the `onEnterKey`
   */
  typeaheadTabPressed(origin: number): void {
    if (this.tagTypeAhead !== '') {
      this.onEnterKey(this.tagTypeAhead, origin)
      this.tagTypeAhead = ''
    }
  }

  /*
   * Update the min and max resolution for the resolution filter
   * hacked to set rightBound to Infinity when close-enough to the right side
   * @param selection
   */
  newLengthFilterSelected(selection: number[]): void {
    this.durationLeftBound = selection[0]

    if (selection[1] > this.durationOutlierCutoff - 10) {
      this.durationRightBound = Infinity
    } else {
      this.durationRightBound = selection[1]
    }
  }

  newSizeFilterSelected(selection: number[]): void {
    this.sizeLeftBound = selection[0]

    if (selection[1] > this.sizeOutlierCutoff - 10) {
      this.sizeRightBound = Infinity
    } else {
      this.sizeRightBound = selection[1]
    }
  }

  newTimesPlayedFilterSelected(selection: number[]): void {
    this.timesPlayedLeftBound = selection[0]
    this.timesPlayedRightBound = selection[1]
  }

  newYearFilterSelected(selection: number[]): void {
    this.yearLeftBound = selection[0]
    this.yearRightBound = selection[1]
  }

  setUpDurationFilterValues(finalArray: ImageElement[]): void {
    const durations: number[] = finalArray.map(element => {
      return element.duration
    })

    const cutoff = this.getOutlierCutoff(durations)

    this.durationOutlierCutoff = Math.floor(cutoff)
  }

  setUpSizeFilterValues(finalArray: ImageElement[]): void {
    const fileSizes: number[] = finalArray.map(element => {
      return element.fileSize
    })

    this.sizeOutlierCutoff = Math.max(...fileSizes)
  }

  setUpTimesPlayedFilterValues(finalArray: ImageElement[]): void {
    const timesPlayed: number[] = finalArray.map(element => {
      return element.timesPlayed
    })

    this.timesPlayedCutoff = Math.max(...timesPlayed)
  }

  // need to filter otherwise cutoff will be NaN
  setUpYearFilterValues(finalArray: ImageElement[]): void {
    const year: number[] = finalArray.map(element => {
      return element.year
    })
    const filtrate = el => Number.isInteger(el) && el > 0
    const yearFiltered = year.filter(filtrate)
    this.yearMinCutoff = Math.min(...yearFiltered) - 1
    this.yearCutoff = Math.max(...yearFiltered)
  }
  /**
   * Given an array of numbers
   * returns the cutoff for outliers
   * defined unconventionally as "anything beyond the 3rd quartile + 3 * IQR (the inter-quartile range)"
   *   cutoff may be the max number if the other computation returns a number too high
   * @param someArray
   */
  getOutlierCutoff(someArray: number[]): number {
    const values = someArray.slice()
    const max = Math.max(...values)
    values.sort((a, b) => {
      return a - b
    })

    const q1 = values[Math.floor(values.length / 4)]
    const q3 = values[Math.ceil(values.length * (3 / 4))]
    const iqr = q3 - q1

    return Math.min(q3 + iqr * 3, max)
  }

  addTagToManyVideos(tag: string): void {
    this.imageElementService.imageElements.forEach((element: ImageElement) => {
      if (element.selected) {
        this.addTagToThisElement(tag, element)
      }
    })

    this.ifShowDetailsViewRefreshTags()
  }

  /**
   * Add a tag to some element
   * Also updates the tag count in `manualTagsService`
   * @param tag
   * @param element
   */
  addTagToThisElement(tag: string, element: ImageElement): void {
    if (!element.tags || !element.tags.includes(tag)) {
      this.manualTagsService.addTag(tag) // only updates the count in the tray, nothing else!

      this.imageElementService.HandleEmission({
        type: 'add',
        index: element.index,
        tag: tag,
      })
    }
  }

  /**
   * If current view is `showDetails` refresh all showing tags
   * hack to make newly-added tags appear next to videos
   */
  ifShowDetailsViewRefreshTags(): void {
    if (
      this.appState.currentView === 'showDetails' ||
      this.appState.currentView === 'showDetails2'
    ) {
      // details view shows tags but they don't update without some code that forces a refresh :(
      // hack-y code simply hides manual tags and then shows them again
      this.settingsButtons.manualTags.toggled = !this.settingsButtons.manualTags.toggled
      this.cd.detectChanges()
      this.settingsButtons.manualTags.toggled = !this.settingsButtons.manualTags.toggled
    }
  }

  /**
   * Toggle between batch tag edit mode and normal mode
   */
  toggleBatchTaggingMode(): void {
    if (this.batchTaggingMode) {
      this.imageElementService.imageElements.forEach((element: ImageElement) => {
        element.selected = false
      })
    }
    this.batchTaggingMode = !this.batchTaggingMode
  }

  /**
   * Select all visible videos for batch tagging
   */
  selectAllVisible(): void {
    this.pipeSideEffectService.selectAll()
  }

  /**
   * Check whether new version of the app is available
   */
  checkForNewVersion(): void {
    this.http.get('https://xx').subscribe(
      (version: string) => {
        this.latestVersionAvailable = version
      },
      (err: any) => {
        this.latestVersionAvailable = 'error'
      },
    )
  }

  goDownloadNewVersion(): void {
    console.log(`goDownloadNewVersion`)
  }

  /**
   * Open modal with instructions for how to use the app. Only runs when `settings.json` is not found
   */
  showFirstRunMessage(): void {
    this.toggleButton('showThumbnails')
    this.isFirstRunEver = false
    this.modalService.openWelcomeMessage()
  }

  /**
   * Start the remote server
   * @param port - number of the port
   */
  startServer(port: number): void {
    console.log('Start the remote server')
  }

  /**
   * Stop the remote server
   */
  stopServer(): void {
    console.log('stopping server')
    console.log('send⭐ stop-server')
    this.serverDetailsBehaviorSubject.next(undefined)
  }
}
