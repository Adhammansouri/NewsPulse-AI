import { ArrowSquareOut, WarningOctagon } from "@phosphor-icons/react";

export const OPENAI_BILLING_URL = "https://platform.openai.com/settings/organization/billing/overview";

export function QuotaNotice() {
  return (
    <div className="notice is-warn" role="alert">
      <WarningOctagon size={20} weight="fill" aria-hidden="true" />
      <div>
        <strong>رصيد OpenAI انتهى</strong>
        التوليد متوقف حتى يُشحن الرصيد من صفحة الفوترة.
        <a className="notice-action" href={OPENAI_BILLING_URL} target="_blank" rel="noreferrer">
          اشحن الرصيد
          <ArrowSquareOut size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
