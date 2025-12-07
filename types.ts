
export type Language = 
  | 'en' // English
  | 'ar' // Arabic
  | 'fr' // French
  | 'ru' // Russian
  | 'cs' // Czech
  | 'es' // Spanish
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'zh' // Chinese (Simplified)
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'nl' // Dutch
  | 'tr' // Turkish
  | 'pl' // Polish
  | 'hi' // Hindi
  | 'vi' // Vietnamese
  | 'th' // Thai
  | 'id'; // Indonesian

export type Complexity = 'concise' | 'standard' | 'detailed';

export interface Preset {
  id: string;
  name: string;
  language: Language;
  complexity: Complexity;
  customStyle?: string;
}

export interface LangOption {
  code: Language;
  label: string;
  flag: string;
}

export interface RegionGroup {
  region: string;
  langs: LangOption[];
}

export interface PromptResponse {
  english: string;
  translated?: string | null;
  variations?: Array<{ style: string, prompt: string }>;
  customVariation?: { style: string, prompt: string };
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  style: string;
  promptResponse: PromptResponse;
}

export interface Translations {
  title: string;
  subtitle: string;
  uploadTitle: string;
  uploadDesc: string;
  analyzeBtn: string;
  analyzing: string;
  resultTitle: string;
  copyBtn: string;
  copied: string;
  footerText: string;
  footerLinkText: string;
  errorGeneric: string;
  errorQuota: string;
  errorRateLimit: string;
  resetBtn: string;
  saveImageBtn: string;
  tabEnglish: string;
  tabTranslated: string;
  tabCustom: string;
  // Complexity Texts
  complexityLabel: string;
  complexShort: string;
  complexNormal: string;
  complexLong: string;
  // Custom Style
  customStyleLabel: string;
  customStylePlaceholder: string;
  // Presets
  presetsLabel: string;
  savePresetPlaceholder: string;
  saveBtn: string;
  noPresets: string;
  editPreset: string;
  updateBtn: string;
  cancelBtn: string;
  // Premium Texts
  goPremium: string;
  premiumActive: string;
  premiumModalTitle: string;
  premiumBenefit1: string;
  premiumBenefit2: string;
  premiumBenefit3: string;
  upgradeBtn: string; 
  securePayment: string;
  variationsTitle: string;
  // License System
  haveCode: string;
  enterCode: string;
  unlockBtn: string;
  invalidCode: string;
  // Sharing
  shareTwitter: string;
  shareInstagram: string;
  sharePinterest: string;
  shareReddit: string;
  shareSystem: string;
  // Theme
  themeLight: string;
  themeDark: string;
  // Gallery
  galleryTitle: string;
  // Video
  generateVideoBtn: string;
  generatingVideo: string;
  videoTitle: string;
  videoError: string;
}