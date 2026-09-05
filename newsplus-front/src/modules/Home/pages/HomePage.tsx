import { useQuery } from "@tanstack/react-query";
import { DeskCompose } from "@/components/brand/desk/DeskCompose";
import { DeskGreeting } from "@/components/brand/desk/DeskGreeting";
import { DeskHeadlines } from "@/components/brand/desk/DeskHeadlines";
import { DeskPulse } from "@/components/brand/desk/DeskPulse";
import { DeskTools } from "@/components/brand/desk/DeskTools";
import { useHealth } from "@/hooks/useHealth";
import { useSession } from "@/hooks/useSession";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { getNewsSources } from "@/services/newsService";

export default function HomePage() {
  const session = useSession();
  const healthQuery = useHealth();

  const sourcesQuery = useQuery({
    queryKey: ["news-sources"],
    queryFn: getNewsSources,
  });

  const feedQuery = useNewsFeed();

  const headlines = (feedQuery.data?.items ?? []).slice(0, 8);

  return (
    <div className="desk-page">
      <DeskGreeting displayName={session?.user.displayName ?? session?.user.identifier ?? "محرر"} />

      <div className="desk-layout">
        <div className="desk-rail">
          <DeskCompose />
          <DeskTools />
        </div>
        <DeskHeadlines items={headlines} isLoading={feedQuery.isLoading} isError={feedQuery.isError} />
      </div>

      <DeskPulse
        sources={sourcesQuery.data?.sources ?? []}
        fetchedAt={feedQuery.data?.fetchedAt}
        health={healthQuery.data}
        healthLoading={healthQuery.isLoading}
        healthError={healthQuery.isError}
      />
    </div>
  );
}
