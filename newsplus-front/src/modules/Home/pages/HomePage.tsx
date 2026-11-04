import { DeskCompose } from "@/components/brand/desk/DeskCompose";
import { DeskGreeting } from "@/components/brand/desk/DeskGreeting";
import { DeskHeadlines } from "@/components/brand/desk/DeskHeadlines";
import { useSession } from "@/hooks/useSession";
import { useNewsFeed } from "@/hooks/useNewsFeed";

export default function HomePage() {
  const session = useSession();

  const feedQuery = useNewsFeed();

  const headlines = (feedQuery.data?.items ?? []).slice(0, 8);

  return (
    <div className="desk-page">
      <DeskGreeting displayName={session?.user.displayName ?? session?.user.identifier ?? "محرر"} />

      <div className="desk-layout">
        <div className="desk-rail">
          <DeskCompose />
        </div>
        <DeskHeadlines items={headlines} isLoading={feedQuery.isLoading} isError={feedQuery.isError} />
      </div>
    </div>
  );
}
