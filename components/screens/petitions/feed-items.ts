export type FeedItem = { id: string; key: string; label: string; tx: string };
export function mergeFeedItems(incoming: FeedItem[], previous: FeedItem[]) {
  const seen = new Set<string>();
  return [...incoming, ...previous].filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, 8);
}
