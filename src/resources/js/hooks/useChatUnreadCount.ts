import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/api/chat';

export function useChatUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: ['chatUnreadCount'],
    queryFn: getUnreadCount,
    staleTime: 0,
    // WebSocket + 再接続キャッチアップが主、ポーリングはフォールバック
    refetchInterval: 60_000,
    enabled,
  });
}
