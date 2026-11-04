// DeskUsage / MobUsage non-ready states (S09 §B) — ports of the `isLoading`, `isError`, `isSetup` and `isForbidden`
// branches of docs/redesign/design/reference/DeskUsage.dc.html and MobUsage.dc.html. Inline styles are the boards' own.
import { Link } from "react-router-dom";
import { useHealth } from "@/hooks/useHealth";
import { AiSteps, type AiStep } from "@/ui/AiSteps";
import { Button, buttonClassName } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Icon } from "@/ui/Icon";
import { Panel } from "@/ui/Panel";
import { Skeleton } from "@/ui/Skeleton";

const LOADING_LINE = "بنجيب الأرقام من حساب OpenAI…";
/** DeskUsage-loading bar heights, in the board's order. */
const SKELETON_BARS = ["40%", "55%", "30%", "50%", "80%", "92%", "70%"] as const;

export function DeskUsageLoading() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr 1fr 1fr", gap: "14px" }}>
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} height={150} radius={20} />
        ))}
      </div>
      <Panel className="col" style={{ padding: "20px 22px", gap: "16px" }}>
        <Skeleton height={18} width="22%" />
        <div className="row" style={{ alignItems: "flex-end", height: "200px", gap: "18px" }}>
          {SKELETON_BARS.map((height, index) => (
            <Skeleton key={index} className="grow" height={height} />
          ))}
        </div>
      </Panel>
      <p className="live" style={{ justifyContent: "center" }}>
        {LOADING_LINE}
      </p>
    </>
  );
}

export function MobUsageLoading() {
  return (
    <>
      <Skeleton height={150} radius={20} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} height={72} radius={16} />
        ))}
      </div>
      <Skeleton height={170} radius={20} />
      <p className="live" style={{ justifyContent: "center" }}>
        {LOADING_LINE}
      </p>
    </>
  );
}

const STATE_PANEL_STYLE = { padding: "56px 40px", display: "grid", placeItems: "center" } as const;

/** `isError`: network / 5xx («حساب OpenAI ما ردّش…»), or an account status with its existing message as the text. */
export function UsageError({ message, retrying, onRetry }: { message: string | null; retrying: boolean; onRetry: () => void }) {
  return (
    <Panel as="section" style={STATE_PANEL_STYLE}>
      <EmptyState
        style={{ maxWidth: "460px" }}
        art={<Icon name="wifi-off" size="xl" />}
        artStyle={{ background: "var(--breaking-soft)", color: "var(--breaking)" }}
        title="تعذّر الاتصال بصفحة الاستهلاك"
        description={message ?? "حساب OpenAI ما ردّش. المحرّر شغال عادي، المشكلة في عرض الأرقام بس."}
      >
        <Button variant="ink" loading={retrying} onClick={onRetry}>
          <Icon name="refresh" />
          حاول تاني
        </Button>
      </EmptyState>
    </Panel>
  );
}

/** `isForbidden`: HTTP 403 — the usage API is for the account admin. */
export function UsageForbidden() {
  return (
    <Panel as="section" style={STATE_PANEL_STYLE}>
      <EmptyState
        style={{ maxWidth: "440px" }}
        art={<Icon name="lock" size="xl" />}
        title="الصفحة دي لمسؤول الحساب"
        description="بيانات التكلفة والحدود بتظهر للأدمن بس. لو محتاجها، اطلب صلاحية من مسؤول النظام."
      >
        <Link className={buttonClassName({ variant: "quiet" })} to="/">
          ارجع للرئيسية
        </Link>
      </EmptyState>
    </Panel>
  );
}

const ADMIN_KEYS_URL = "https://platform.openai.com/settings/organization/admin-keys";

/**
 * `isSetup` (not-configured): connect the OpenAI admin key. The first step is done while the editor's own OpenAI
 * key is connected (`/health` → `openai`). `stacked`: one column (mobile, not designed — see the S09 report).
 */
export function UsageSetup({ stacked = false }: { stacked?: boolean }) {
  const health = useHealth();
  const steps: AiStep[] = [
    { id: "editor", label: "المحرّر متصل بـ OpenAI", status: health.data?.openai === false ? "todo" : "done" },
    { id: "key", label: "أنشئ Admin API Key من إعدادات المؤسسة", status: "active" },
    { id: "env", label: "أضفه في OPENAI_ADMIN_KEY على السيرفر", status: "todo" },
    { id: "restart", label: "أعد تشغيل الـ API", status: "todo" },
  ];

  return (
    <Panel
      as="section"
      style={
        stacked
          ? { padding: "18px", display: "grid", gap: "18px" }
          : { padding: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "center" }
      }
    >
      <div className="col" style={{ gap: "12px" }}>
        <span className="ic-wrap ic-wrap--ai" style={{ width: "56px", height: "56px", borderRadius: "16px" }}>
          <Icon name="chart" size="lg" />
        </span>
        <h2 className="t-display">خطوة واحدة لعرض أرقام حسابك</h2>
        <p className="t-small">
          اربط مفتاح إدارة OpenAI على السيرفر عشان تظهر هنا التكلفة والتوكنز وحدود الإنفاق. مفتاح تشغيل المحرّر لوحده مش كفاية.
        </p>
        <a
          className={buttonClassName({ variant: "ink" })}
          href={ADMIN_KEYS_URL}
          target="_blank"
          rel="noreferrer"
          style={{ alignSelf: "flex-start" }}
        >
          افتح إعدادات مفاتيح الإدارة
          <Icon name="external" size="sm" />
        </a>
      </div>
      <AiSteps
        steps={steps}
        className="panel panel--flat"
        style={{ padding: "22px", background: "var(--surface-2)", gap: "16px" }}
      />
    </Panel>
  );
}
