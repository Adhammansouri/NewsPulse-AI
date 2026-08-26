export type GenerateStyle = "brief" | "article" | "report";
export type GenerateLanguage = "ar" | "en";

export type GenerateRequest = {
  prompt: string;
  style: GenerateStyle;
  language: GenerateLanguage;
  angle?: string;
};

export type GenerateData = {
  title: string;
  dek: string;
  body: string;
  language: GenerateLanguage;
};
