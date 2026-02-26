import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/api/chat';

export function useChatUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: ['chatUnreadCount'],
    queryFn: getUnreadCount,
    staleTime: 0,
    refetchInterval: 3_000,
    enabled,
  });
}
