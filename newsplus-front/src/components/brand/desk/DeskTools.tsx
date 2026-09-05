import { Link } from "react-router-dom";
import { CaretLeft, Newspaper, PencilSimple, Translate } from "@phosphor-icons/react";
import { HOME_FEATURES } from "@/utils/constants";

const TOOL_ICONS = {
  "/news": Newspaper,
  "/generate": PencilSimple,
  "/translate": Translate,
} as const;

export function DeskTools() {
  return (
    <section className="desk-tools" aria-labelledby="desk-tools-title">
      <h2 id="desk-tools-title" className="desk-tools__title">
        الأدوات
      </h2>

      {HOME_FEATURES.map((feature) => {
        const Icon = TOOL_ICONS[feature.href];
        return (
          <Link key={feature.href} to={feature.href} className="desk-tool">
            <span className="desk-tool__icon" aria-hidden="true">
              <Icon size={18} weight="regular" />
            </span>
            <span>
              <span className="desk-tool__name">{feature.title}</span>
              <span className="desk-tool__desc">{feature.description}</span>
            </span>
            <CaretLeft className="desk-tool__go" size={16} weight="bold" aria-hidden="true" />
          </Link>
        );
      })}
    </section>
  );
}
