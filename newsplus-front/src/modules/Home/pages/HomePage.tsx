import { FeatureCard } from "@/components/brand/FeatureCard";
import { BrandHeroLockup } from "@/components/brand/BrandHeroLockup";
import { HeroCta } from "@/components/brand/HeroCta";
import { BrandSystemStatus } from "@/components/brand/SystemStatus";
import { useHealth } from "@/hooks/useHealth";
import { HOME_FEATURES } from "@/utils/constants";

export default function HomePage() {
  const { data: health, isLoading, isError } = useHealth();
  const [featured, ...rest] = HOME_FEATURES;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-14 lg:mb-16">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <div className="brand-fade-in">
            <span className="brand-badge brand-badge-teal">مساعد إخباري بالذكاء الاصطناعي</span>

            <h1 className="brand-display mt-5">
              من الخبر{" "}
              <span className="inline-flex align-middle">
                <img
                  src="/icons/logo-icon.png"
                  alt=""
                  width={40}
                  height={40}
                  className="inline-block rounded-md align-middle shadow-sm ring-1 brand-border-default"
                />
              </span>
              {" "}الخام إلى محتوى جاهز للنشر
            </h1>

            <p className="brand-body mt-5">
              Newsplus يساعدك على متابعة الأخبار، تلخيصها، ترجمتها، وكتابة تقارير
              احترافية بأسلوب تحريري متسق.
            </p>

            <HeroCta />
          </div>

          <div className="brand-panel relative overflow-hidden rounded-[1.35rem] bg-navy-900 p-6 text-center sm:p-8 brand-fade-in">
            <div className="absolute inset-x-0 top-0 h-1 bg-teal-500" aria-hidden="true" />
            <BrandHeroLockup />
            <p className="mt-8 max-w-xs text-sm leading-7 text-slate-300">
              منصة واحدة لمراقبة المصادر، التلخيص، الترجمة، وتوليد المحتوى التحريري.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <div className="mb-8">
          <h2 className="brand-text-primary text-xl font-semibold tracking-tight">ابدأ من هنا</h2>
          <p className="brand-text-secondary mt-1 text-sm">اختر الأداة المناسبة لسير عملك التحريري</p>
        </div>

        <div className="flex flex-col gap-4">
          <FeatureCard {...featured} variant="featured" index={0} />

          <div className="grid gap-4 sm:grid-cols-2">
            {rest.map((feature, i) => (
              <FeatureCard key={feature.href} {...feature} index={i + 1} />
            ))}
          </div>
        </div>
      </section>

      <BrandSystemStatus isLoading={isLoading} isError={isError} health={health} />
    </div>
  );
}
