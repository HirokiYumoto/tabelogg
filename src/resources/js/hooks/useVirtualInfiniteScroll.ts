import { useMemo, useEffect } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

interface UseVirtualInfiniteScrollOptions<T> {
  items: T[];
  columns: number;
  estimateRowHeight: number;
  overscan?: number;
  prefetchThreshold?: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function useVirtualInfiniteScroll<T>({
  items,
  columns,
  estimateRowHeight,
  overscan = 5,
  prefetchThreshold = 0.8,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseVirtualInfiniteScrollOptions<T>) {
  const rows = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      result.push(items.slice(i, i + columns));
    }
    return result;
  }, [items, columns]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => estimateRowHeight,
    overscan,
  });

  // Prefetch when scrolled past threshold
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || rows.length === 0 || virtualItems.length === 0) return;
    const lastVirtual = virtualItems[virtualItems.length - 1];
    if (lastVirtual && lastVirtual.index / rows.length >= prefetchThreshold) {
      fetchNextPage();
    }
  }, [virtualItems, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage, prefetchThreshold]);

  return { virtualizer, rows, totalHeight: virtualizer.getTotalSize() };
}
