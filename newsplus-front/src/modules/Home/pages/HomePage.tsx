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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <DeskGreeting displayName={session?.user.displayName ?? session?.user.identifier ?? "محرر"} />

      <div className="mt-8 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-10">
        <div className="order-2 lg:order-1">
          <DeskHeadlines items={headlines} isLoading={feedQuery.isLoading} isError={feedQuery.isError} />
        </div>
        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <DeskCompose />
          <DeskTools />
        </div>
      </div>

      <div className="mt-10">
        <DeskPulse
          sources={sourcesQuery.data?.sources ?? []}
          fetchedAt={feedQuery.data?.fetchedAt}
          health={healthQuery.data}
          healthLoading={healthQuery.isLoading}
          healthError={healthQuery.isError}
        />
      </div>
    </div>
  );
}
