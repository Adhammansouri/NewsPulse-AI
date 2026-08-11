import Image from "next/image";
import Link from "next/link";
import { FeatureCard } from "@/components/FeatureCard";

const features = [
  {
    href: "/news",
    title: "ملخص الأخبار",
    description: "تابع آخر الأخبار من مصادر عربية ودولية مع ملخصات سريعة وواضحة.",
    badge: "مراقبة",
    accent: "teal" as const,
  },
  {
    href: "/generate",
    title: "توليد المحتوى",
    description: "اكتب تقارير ومقالات إخبارية بأسلوب تحريري احترافي من موضوع أو رابط.",
    badge: "AI",
    accent: "cyan" as const,
  },
  {
    href: "/translate",
    title: "الترجمة",
    description: "ترجم النصوص بين العربية والإنجليزية مع الحفاظ على السياق والأسلوب.",
    badge: "ثنائي اللغة",
    accent: "navy" as const,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-12 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex rounded-full bg-teal-600/10 px-3 py-1 text-sm font-medium text-teal-600">
              مساعد إخباري بالذكاء الاصطناعي
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
              من الخبر الخام إلى محتوى جاهز للنشر
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              NewsPlus يساعدك على متابعة الأخبار، تلخيصها، ترجمتها، وكتابة تقارير
              احترافية بأسلوب تحريري متسق.
            </p>
          </div>
          <div className="flex shrink-0 justify-center lg:justify-end">
            <Image
              src="/icons/logo-icon.png"
              alt="NewsPlus"
              width={160}
              height={160}
              priority
              className="rounded-2xl"
            />
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-6 text-xl font-semibold text-navy-900">ابدأ من هنا</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.href} {...feature} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-slate-600">
          المرحلة الحالية: إعداد المنصة الأساسية.{" "}
          <Link href="/api/health" className="font-medium text-teal-600 hover:underline">
            تحقق من حالة النظام
          </Link>
        </p>
      </section>
    </div>
  );
}
