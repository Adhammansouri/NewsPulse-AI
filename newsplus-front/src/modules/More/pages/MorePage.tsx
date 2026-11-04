// «المزيد» (S02 §4) — port of docs/redesign/design/reference/MobMore.dc.html. Mobile only: `/more` redirects
// to `/` on desktop. Inline styles are the board's own.
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import type { EditorialMemoryRule, OpenAIUsageData } from "@newsplus/shared";
import { usePwaInstall } from "@/components/brand/pwa/usePwaInstall";
import { LogoutDialog } from "@/components/shell/LogoutDialog";
import { features } from "@/config/features";
import { useIsMobile } from "@/hooks/useIsMobile";
import { pushStatusDot, usePushNotifications } from "@/hooks/usePushNotifications";
import { useSession } from "@/hooks/useSession";
import { useTheme } from "@/hooks/useTheme";
import { money, presetRange, usdTotal } from "@/modules/Usage/usageFormat";
import { listEditorialMemory } from "@/services/editorialService";
import { getOpenAIUsage } from "@/services/openaiUsageService";
import type { Theme } from "@/services/themeStore";
import { AiPanel } from "@/ui/AiPanel";
import { Badge } from "@/ui/Badge";
import { Icon } from "@/ui/Icon";
import { Segmented, type SegmentedOption } from "@/ui/Segmented";
import { countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";
import { version as appVersion } from "../../../../package.json";

const THEME_OPTIONS: ReadonlyArray<SegmentedOption<Theme>> = [
  { value: "light", label: "فاتح" },
  { value: "dark", label: "داكن" },
];

/** UI language is only switchable on the login screen until i18n exists: shown, not selectable. */
const LANGUAGE_OPTIONS: ReadonlyArray<SegmentedOption<"ar" | "en">> = [
  { value: "ar", label: "عربي", disabled: true },
  { value: "en", label: "EN", disabled: true },
];

const ACTIVE_RULES: CountForms = {
  one: "قاعدة واحدة مفعّلة",
  two: "قاعدتين مفعّلتين",
  few: "{n} قواعد مفعّلة",
  many: "{n} قاعدة مفعّلة",
};

/** The archive's «ذاكرة الفريق» tab — the archive drawer lives on the news screen until S06. */
const ARCHIVE_MEMORY_PATH = "/news";

const SECTION_TITLE_STYLE = { fontWeight: 600, paddingInline: "4px" } as const;

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function memorySummary(rules: EditorialMemoryRule[]) {
  if (rules.length === 0) return null;
  const count = countPhrase(rules.length, ACTIVE_RULES);
  return rules.some((rule) => isToday(rule.createdAt)) ? `${count} · قاعدة جديدة النهارده` : count;
}

/**
 * This month's cost for the usage scope, and its share of the matching monthly spend limit
 * (the same pairing as the usage screen's spend meters). A missing section hides the value.
 */
function monthUsage(data: OpenAIUsageData | undefined) {
  const rows = data?.monthCosts?.data;
  const cost = rows ? usdTotal(rows) : null;
  if (!data || cost === null) return null;
  const limit = (data.scope?.projectId ? data.projectLimit : data.organizationLimit)?.data;
  const percent = limit && limit.currency === "USD" && limit.amount > 0 ? Math.round((cost / limit.amount) * 100) : null;
  return { cost: money(cost), percent };
}

export default function MorePage() {
  const isMobile = useIsMobile();
  if (!isMobile) return <Navigate to="/" replace />;
  return <MoreScreen />;
}

function MoreScreen() {
  const session = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin";
  const { theme, setTheme } = useTheme();
  const push = usePushNotifications();
  const { canInstall, install } = usePwaInstall();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const logoutRef = useRef<HTMLButtonElement>(null);

  // Same key and request as the archive's memory list (NewsPage), so the two share one cache entry.
  const memoryQuery = useQuery({
    queryKey: ["editorial-memory"],
    queryFn: () => listEditorialMemory("approved"),
  });
  // Same key and request as the usage screen's default period, so opening it from here is instant.
  const usageRange = presetRange("7d");
  const usageQuery = useQuery({
    queryKey: ["openai-usage", user?.id, usageRange.start, usageRange.end, undefined],
    queryFn: ({ signal }) => getOpenAIUsage(usageRange, signal),
    enabled: isAdmin,
    retry: false,
    staleTime: 60_000,
    gcTime: 0,
  });

  const rules = memoryQuery.data?.rules ?? [];
  const memoryLine = memorySummary(rules);
  const usage = isAdmin ? monthUsage(usageQuery.data) : null;
  const pushOn = pushStatusDot(push.status, push.hasSubscription) === "on";
  const displayName = user?.displayName.trim() ?? "";
  const initial = Array.from(displayName)[0] ?? "";

  return (
    <>
      <header className="m-head">
        <span className="m-title">المزيد</span>
      </header>
      <main className="m-scroll col" style={{ padding: "4px 16px 20px", gap: "18px" }}>
        <AiPanel className="row" style={{ gap: "14px", padding: "16px", boxShadow: "none" }}>
          <span className="avatar" style={{ width: "54px", height: "54px", fontSize: "20px", border: 0 }}>
            {initial}
          </span>
          <span className="col grow">
            <b style={{ fontSize: "17px" }}>{displayName}</b>
            <span className="t-meta">{isAdmin ? "مدير" : "محرر"}</span>
          </span>
          {rules.length > 0 && <Badge variant="ai">ذاكرة الفريق · {toArabicDigits(rules.length)}</Badge>}
        </AiPanel>

        <section className="col" style={{ gap: "8px" }}>
          <h2 className="t-meta" style={SECTION_TITLE_STYLE}>
            الإدارة
          </h2>
          <div className="m-list">
            {isAdmin && (
              <Link className="m-item" to="/usage">
                <span className="ic-wrap">
                  <Icon name="chart" />
                </span>
                <span className="m-item__label">
                  استهلاك الذكاء الاصطناعي
                  {usage?.percent != null && <small>{toArabicDigits(usage.percent)}٪ من حد الشهر</small>}
                </span>
                {usage && (
                  <span className="t-meta num" dir="ltr">
                    {usage.cost}
                  </span>
                )}
                <Icon name="arrow-forward" className="chev" />
              </Link>
            )}
            {features.workflow && (
              <Link className="m-item" to="/board">
                <span className="ic-wrap">
                  <Icon name="board" />
                </span>
                <span className="m-item__label">سير العمل</span>
                <Icon name="arrow-forward" className="chev" />
              </Link>
            )}
            <Link className="m-item" to={ARCHIVE_MEMORY_PATH}>
              <span className="ic-wrap ic-wrap--ai">
                <Icon name="memory" />
              </span>
              <span className="m-item__label">
                ذاكرة الفريق
                {memoryLine && <small>{memoryLine}</small>}
              </span>
              <Icon name="arrow-forward" className="chev" />
            </Link>
          </div>
        </section>

        <section className="col" style={{ gap: "8px" }}>
          <h2 className="t-meta" style={SECTION_TITLE_STYLE}>
            التفضيلات
          </h2>
          <div className="m-list">
            <Link className="m-item" to="/notifications">
              <span className="ic-wrap">
                <Icon name="bell" />
              </span>
              <span className="m-item__label">
                إشعارات العاجل
                {pushOn && <small>مفعّلة على هذا الجهاز</small>}
              </span>
              {pushOn && <Badge variant="ok">مفعّلة</Badge>}
              <Icon name="arrow-forward" className="chev" />
            </Link>
            <div className="m-item">
              <span className="ic-wrap">
                <Icon name="moon" />
              </span>
              <span className="m-item__label">المظهر</span>
              <Segmented options={THEME_OPTIONS} value={theme} onChange={setTheme} />
            </div>
            <div className="m-item">
              <span className="ic-wrap">
                <Icon name="translate" />
              </span>
              <span className="m-item__label">لغة الواجهة</span>
              <Segmented options={LANGUAGE_OPTIONS} value="ar" />
            </div>
          </div>
        </section>

        <section className="col" style={{ gap: "8px" }}>
          <h2 className="t-meta" style={SECTION_TITLE_STYLE}>
            التطبيق
          </h2>
          <div className="m-list">
            {canInstall && (
              <button className="m-item" type="button" onClick={() => void install()}>
                <span className="ic-wrap">
                  <Icon name="download" />
                </span>
                <span className="m-item__label">
                  ثبّت التطبيق<small>افتحه من الشاشة الرئيسية</small>
                </span>
                <Icon name="arrow-forward" className="chev" />
              </button>
            )}
            <button
              ref={logoutRef}
              className="m-item"
              type="button"
              style={{ color: "var(--breaking)" }}
              onClick={() => setLogoutOpen(true)}
            >
              <span className="ic-wrap ic-wrap--breaking">
                <Icon name="logout" />
              </span>
              <span className="m-item__label">تسجيل الخروج</span>
            </button>
          </div>
        </section>

        <p className="t-meta" style={{ textAlign: "center" }}>
          Newsplus · الإصدار {toArabicDigits(appVersion)}
        </p>
      </main>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} returnFocusRef={logoutRef} />
    </>
  );
}
