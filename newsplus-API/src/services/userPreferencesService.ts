// S16 `GET/PUT /me/preferences`: the signed-in editor's onboarding choices. A PUT replaces the fields it sends and
// keeps the others; `onboarded: true` stamps `onboardedAt` once (finishing or skipping onboarding), and it is never
// cleared. Followed sources must be ids the aggregator lists.
import type { UserPreferences } from "@newsplus/shared";
import type { UserPreferencesUpdateBody } from "../schemas/onboarding.schema.js";
import { ValidationError } from "../utils/errors.js";
import type { NewsAggregator } from "./newsAggregator.js";
import type { UserPreferencesStore } from "./userPreferencesStore.js";

type UserPreferencesDeps = {
  store: Pick<UserPreferencesStore, "get" | "save">;
  aggregator: Pick<NewsAggregator, "listSources">;
  /** Clock for `onboardedAt` (tests). */
  now?: () => number;
};

export class UserPreferencesService {
  private readonly now: () => number;

  constructor(private readonly deps: UserPreferencesDeps) {
    this.now = deps.now ?? Date.now;
  }

  get(userId: string): UserPreferences {
    return this.deps.store.get(userId);
  }

  update(userId: string, patch: UserPreferencesUpdateBody): UserPreferences {
    if (patch.sources) {
      const known = new Set(this.deps.aggregator.listSources().map((source) => source.id));
      if (patch.sources.some((id) => !known.has(id))) throw new ValidationError();
    }
    const current = this.deps.store.get(userId);
    const hookStyle = patch.hookStyle ?? current.hookStyle;
    const onboardedAt = current.onboardedAt ?? (patch.onboarded ? new Date(this.now()).toISOString() : undefined);
    return this.deps.store.save(
      userId,
      {
        platforms: patch.platforms ?? current.platforms,
        sources: patch.sources ?? current.sources,
        ...(hookStyle ? { hookStyle } : {}),
        ...(onboardedAt ? { onboardedAt } : {}),
      },
      new Date(this.now()),
    );
  }
}
