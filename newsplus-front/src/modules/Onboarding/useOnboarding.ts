// S16 «أول تشغيل»: the onboarding state — the step, the choices, the example story and its three hooks
// (`POST /news/hook-styles`, an AI route), and the two endings: «ابدأ الشغل» saves the preferences and the hook
// style's memory rule, «تخطّي» only marks onboarding done. Both write the saved preferences into the query the
// onboarding gate reads before leaving, so the gate never sends the editor back here.
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import type { EditorialPublishPlatform, HookStyle, NewsSource, UserPreferences } from "@newsplus/shared";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { preferencesKey, usePreferences } from "@/hooks/usePreferences";
import { useSession } from "@/hooks/useSession";
import { createEditorialMemory } from "@/services/editorialService";
import { getNewsSources } from "@/services/newsService";
import { getHookStyles, saveMyPreferences } from "@/services/preferencesService";
import {
  exampleStory,
  hookStyleRule,
  nextStep,
  onboardingTarget,
  platformsToSave,
  previousStep,
  sourcesToSave,
  summaryLines,
  toggle,
  type OnboardingStep,
} from "./onboardingModel";

const NO_SOURCES: NewsSource[] = [];

export function useOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  const cooldown = useAiCooldown();
  const preferences = usePreferences();
  // Same keys as the wire: a source list or feed already loaded is reused.
  const sourcesQuery = useQuery({ queryKey: ["news-sources"], queryFn: getNewsSources });
  const feed = useNewsFeed("all", "");

  const [step, setStep] = useState<OnboardingStep>(1);
  const [platforms, setPlatforms] = useState<EditorialPublishPlatform[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [hookStyle, setHookStyle] = useState<HookStyle | null>(null);
  /** Choices already saved (/welcome opened again) fill the steps, unless the editor started picking. */
  const [seeded, setSeeded] = useState(false);
  if (!seeded && preferences.data) {
    setSeeded(true);
    setPlatforms(preferences.data.platforms);
    setSources(preferences.data.sources);
    setHookStyle(preferences.data.hookStyle ?? null);
  }

  const sourceList = sourcesQuery.data?.sources ?? NO_SOURCES;
  const chosenSources = useMemo(() => sourceList.filter((source) => sources.includes(source.id)), [sourceList, sources]);

  // Step 3's example: fixed when the step opens (a feed poll never swaps the story under the editor's choice).
  const [exampleId, setExampleId] = useState<string | null>(null);
  const items = feed.data?.items;
  if (step === 3 && exampleId === null && items) {
    const story = exampleStory(items, sources);
    if (story) setExampleId(story.id);
  }

  const hooks = useQuery({
    queryKey: ["hook-styles", exampleId],
    queryFn: ({ signal }) => getHookStyles({ itemId: exampleId ?? "" }, signal),
    // During the AI cooldown the request waits (the cooldown card says why); the rows stay as skeletons.
    enabled: step === 3 && exampleId !== null && !cooldown.active,
    staleTime: Infinity,
    retry: false,
  });

  function leave(saved: UserPreferences, ruleSaved: boolean) {
    queryClient.setQueryData(preferencesKey(userId), saved);
    if (ruleSaved) void queryClient.invalidateQueries({ queryKey: ["editorial-memory"] });
    navigate(onboardingTarget(location.state), { replace: true });
  }

  const finishMutation = useMutation({
    mutationFn: async () => {
      const saved = await saveMyPreferences({
        platforms: platformsToSave(platforms),
        sources: sourcesToSave(sources, sourceList),
        ...(hookStyle ? { hookStyle } : {}),
        onboarded: true,
      });
      if (hookStyle) await createEditorialMemory(hookStyleRule(hookStyle));
      return saved;
    },
    onSuccess: (saved) => leave(saved, Boolean(hookStyle)),
  });

  const skipMutation = useMutation({
    mutationFn: () => saveMyPreferences({ onboarded: true }),
    onSuccess: (saved) => leave(saved, false),
  });

  const busy = finishMutation.isPending || skipMutation.isPending;

  // A new step moves focus to its title (the content above the buttons changed).
  const titleRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    titleRef.current?.focus();
  }, [step]);

  function choose() {
    setSeeded(true);
  }

  return {
    step,
    titleRef,
    platforms,
    togglePlatform(id: EditorialPublishPlatform) {
      choose();
      setPlatforms((current) => toggle(current, id));
    },
    sources,
    sourceList,
    sourcesLoading: sourcesQuery.isPending,
    sourcesError: sourcesQuery.error,
    toggleSource(id: string) {
      choose();
      setSources((current) => toggle(current, id));
    },
    hookStyle,
    chooseHookStyle(style: HookStyle) {
      choose();
      setHookStyle(style);
    },
    hooks: hooks.data ?? null,
    /** The three `sk` rows: the feed or the hooks are on their way (or waiting for the AI cooldown). */
    hooksLoading: !hooks.data && !hooks.error && !feed.error && (exampleId !== null || feed.isPending),
    hooksError: hooks.error ?? feed.error,
    retryHooks() {
      if (hooks.error) void hooks.refetch();
      else void feed.refetch();
    },
    summary: summaryLines({ platforms, sources: chosenSources, hookStyle }),
    busy,
    finishing: finishMutation.isPending,
    skipping: skipMutation.isPending,
    saveError: finishMutation.error ?? skipMutation.error,
    next() {
      if (busy) return;
      if (step === 3) finishMutation.mutate();
      else setStep(nextStep(step));
    },
    back() {
      if (!busy) setStep(previousStep(step));
    },
    skip() {
      if (!busy) skipMutation.mutate();
    },
  };
}

export type Onboarding = ReturnType<typeof useOnboarding>;
