import { ToolPage } from "@/components/shared/ToolPage";

export default function NewsPage() {
  return (
    <ToolPage
      title="ملخص الأخبار"
      description="تابع أهم الأخبار من مصادرك المفضلة مع ملخصات سريعة ومنظمة."
      placeholder="الصق رابط خبر أو اكتب موضوعاً للمتابعة..."
      actionLabel="تلخيص الأخبار"
      badge="قريباً"
    />
  );
}
