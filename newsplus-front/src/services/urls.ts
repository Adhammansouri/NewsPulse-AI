/** Dev uses Vite proxy (/api). Production uses VITE_API_BASE_URL. */
export const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const API_URLS = {
  HEALTH: "/health",
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
  },
  NEWS: {
    SUMMARIZE: "/news/summarize",
    SOURCES: "/news/sources",
    FEED: "/news/feed",
  },
  EDITORIAL: {
    CONVERSATIONS: "/editorial/conversations",
    CONVERSATION: (id: string) => `/editorial/conversations/${id}`,
    REVISE: (id: string) => `/editorial/conversations/${id}/revise`,
    RESTORE: (id: string) => `/editorial/conversations/${id}/restore`,
    MEMORY: "/editorial/memory",
    MEMORY_RULE: (id: string) => `/editorial/memory/${id}`,
  },
  GENERATE: {
    CONTENT: "/generate",
  },
  TRANSLATE: {
    TEXT: "/translate",
  },
  PUSH: {
    VAPID_KEY: "/push/vapid-key",
    SUBSCRIBE: "/push/subscribe",
    TEST: "/push/test",
  },
} as const;
