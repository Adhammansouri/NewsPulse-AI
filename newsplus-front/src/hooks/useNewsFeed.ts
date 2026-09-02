import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getNewsFeed } from "@/services/newsService";

export function useNewsFeed(source = "all", query = "") {
  return useQuery({
    queryKey: ["news-feed", source, query],
    queryFn: () => getNewsFeed(source, query || undefined),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
  });
}
