import { FeatureCard } from "@/components/brand/FeatureCard";
import { HOME_FEATURES } from "@/utils/constants";

export function DeskTools() {
  const [featured, ...rest] = HOME_FEATURES;

  return (
    <section aria-labelledby="desk-tools-title">
      <h2 id="desk-tools-title" className="brand-text-primary text-sm font-semibold">
        أدوات المكتب
      </h2>
      <p className="brand-text-secondary mt-1 mb-4 text-sm">افتح الأداة المناسبة لسير العمل.</p>

      <div className="flex flex-col gap-3">
        <FeatureCard {...featured} variant="featured" showArt={false} index={0} />
        <div className="grid gap-3 sm:grid-cols-2">
          {rest.map((feature, i) => (
            <FeatureCard key={feature.href} {...feature} index={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
