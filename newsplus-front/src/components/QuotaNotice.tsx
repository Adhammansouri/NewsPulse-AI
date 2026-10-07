import { ArrowSquareOut } from "@phosphor-icons/react";

export const OPENAI_BILLING_URL = "https://platform.openai.com/settings/organization/billing/overview";

export function QuotaNotice() {
  return (
    <div className="quota-notice" role="alert">
      <p className="quota-notice-title">رصيد OpenAI خلص</p>
      <p className="quota-notice-copy">التوليد متوقف حتى يتم شحن الرصيد من صفحة الفوترة.</p>
      <a className="quota-notice-link" href={OPENAI_BILLING_URL} target="_blank" rel="noreferrer">
        شحن الرصيد
        <ArrowSquareOut size={16} aria-hidden="true" />
      </a>
    </div>
  );
}
