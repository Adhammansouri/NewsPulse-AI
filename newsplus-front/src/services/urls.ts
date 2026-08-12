/** Dev uses Vite proxy (/api). Production uses VITE_API_BASE_URL. */
export const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const API_URLS = {
  HEALTH: "/health",
  NEWS: {
    SUMMARIZE: "/news/summarize",
    SOURCES: "/news/sources",
  },
  GENERATE: {
    CONTENT: "/generate",
  },
  TRANSLATE: {
    TEXT: "/translate",
  },
} as const;
