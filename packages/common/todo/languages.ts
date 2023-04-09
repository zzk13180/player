import { English } from '../i18n/en'
import { Japanese } from '../i18n/ja'
import { Chinese } from '../i18n/zh'

import type { SupportedLanguage } from './app-state'

export const LanguageLookup: Record<SupportedLanguage, any> = {
  en: English,
  ja: Japanese,
  zh: Chinese,
}
