import { ToolPage } from "@/components/shared/ToolPage";

export default function TranslatePage() {
  return (
    <ToolPage
      title="الترجمة"
      description="ترجم بين العربية والإنجليزية مع عرض النص الأصلي والمترجم."
      placeholder="الصق النص أو رابط المحتوى للترجمة..."
      actionLabel="ترجمة"
      badge="قريباً"
    />
  );
}
