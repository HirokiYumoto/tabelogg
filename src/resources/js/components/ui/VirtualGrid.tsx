import type { ReactNode } from 'react';
import { useVirtualInfiniteScroll } from '@/hooks/useVirtualInfiniteScroll';

interface VirtualGridProps<T> {
  items: T[];
  columns: number;
  estimateRowHeight: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  renderItem: (item: T) => ReactNode;
  renderSkeleton: () => ReactNode;
  skeletonCount?: number;
  gap?: string;
  isLoading: boolean;
}

export default function VirtualGrid<T>({
  items,
  columns,
  estimateRowHeight,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  renderItem,
  renderSkeleton,
  skeletonCount = 6,
  gap = 'gap-8',
  isLoading,
}: VirtualGridProps<T>) {
  const { virtualizer, rows, totalHeight } = useVirtualInfiniteScroll({
    items,
    columns,
    estimateRowHeight,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Initial loading: show skeletons
  if (isLoading) {
    const skeletonRows: null[][] = [];
    for (let i = 0; i < Math.ceil(skeletonCount / columns); i++) {
      skeletonRows.push(Array.from({ length: columns }, () => null));
    }
    return (
      <div className={`grid gap-8`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <div key={i}>{renderSkeleton()}</div>
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  const virtualItems = virtualizer.getVirtualItems();

  // Skeleton count for loading-more row
  const loadingMoreSkeletons = isFetchingNextPage ? columns : 0;

  return (
    <div
      style={{ height: totalHeight + (loadingMoreSkeletons > 0 ? estimateRowHeight : 0), position: 'relative', width: '100%' }}
    >
      {virtualItems.map((virtualRow) => {
        const row = rows[virtualRow.index];
        return (
          <div
            key={virtualRow.index}
            ref={virtualizer.measureElement}
            data-index={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div
              className={gap}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {row.map((item, colIndex) => (
                <div key={colIndex}>{renderItem(item)}</div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Loading-more skeletons at the bottom */}
      {isFetchingNextPage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${totalHeight}px)`,
          }}
        >
          <div
            className={gap}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }, (_, i) => (
              <div key={i}>{renderSkeleton()}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
