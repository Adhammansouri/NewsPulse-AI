export type GenerateStyle = "brief" | "article" | "report";
export type GenerateLanguage = "ar" | "en";
export type GenerateLength = "short" | "standard" | "long";
export type GenerateTone = "desk" | "formal" | "explainer";

export type GenerateRequest = {
  prompt: string;
  style: GenerateStyle;
  language: GenerateLanguage;
  angle?: string;
  length?: GenerateLength;
  tone?: GenerateTone;
};

export type GenerateSourceMode = "page" | "search" | "notes";

export type GenerateData = {
  title: string;
  dek: string;
  body: string;
  language: GenerateLanguage;
  sourceMode?: GenerateSourceMode;
};
