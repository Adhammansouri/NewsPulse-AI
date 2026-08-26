export type TranslateLanguage = "ar" | "en";

export type TranslateRequest = {
  text?: string;
  url?: string;
  target: TranslateLanguage;
};

export type TranslateData = {
  sourceLanguage: TranslateLanguage | "other";
  targetLanguage: TranslateLanguage;
  original: string;
  translated: string;
};
