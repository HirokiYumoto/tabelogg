import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useSendMessage,
  useSendImageMessage,
  useHideMessage,
  useHideRoom,
  useBlockUser,
  useUnblockUser,
  useBlockStatus,
  useReportStatus,
  useReport,
} from '@/hooks/useChat';
import type { ChatRoom, BlockStatus, ReportStatus } from '@/types/chat';

interface UseChatPageActionsParams {
  selectedRoom: ChatRoom | null;
  setSelectedRoom: (room: ChatRoom | null) => void;
  newChatRestaurantId: number | null;
  setNewChatRestaurantId: (id: number | null) => void;
  setMobileView: (view: 'list' | 'chat') => void;
  refetchRooms: () => Promise<{ data: ChatRoom[] | undefined }>;
  currentUserId: number | undefined;
  otherUserId: number | null;
  isOwner: boolean;
  selectedRestaurantId: number | null;
  mobileView: 'list' | 'chat';
}

export function useChatPageActions({
  selectedRoom,
  setSelectedRoom,
  newChatRestaurantId,
  setNewChatRestaurantId,
  setMobileView,
  refetchRooms,
  currentUserId,
  otherUserId,
  isOwner,
  selectedRestaurantId,
  mobileView,
}: UseChatPageActionsParams) {
  const [, setSearchParams] = useSearchParams();
  const [reportTarget, setReportTarget] = useState<{ type: string; id: number } | null>(null);

  const sendMutation = useSendMessage();
  const sendImageMutation = useSendImageMessage();
  const hideMessageMutation = useHideMessage();
  const hideRoomMutation = useHideRoom();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const reportMutation = useReport();
  const restaurantId = selectedRoom?.restaurant.id ?? newChatRestaurantId ?? null;
  const { data: blockStatus } = useBlockStatus(restaurantId, otherUserId);
  const { data: reportStatus } = useReportStatus(otherUserId);

  const handleSend = useCallback(
    (body: string) => {
      if (!currentUserId) return;

      if (selectedRoom) {
        const isOwnerSending = selectedRoom.user.id !== currentUserId;
        sendMutation.mutate({
          restaurantId: selectedRoom.restaurant.id,
          body,
          roomId: isOwnerSending ? selectedRoom.id : undefined,
        });
      } else if (newChatRestaurantId) {
        sendMutation.mutate(
          { restaurantId: newChatRestaurantId, body },
          {
            onSuccess: (newMessage) => {
              setNewChatRestaurantId(null);
              refetchRooms().then(({ data: updatedRooms }) => {
                const newRoom = updatedRooms?.find(
                  (r) => r.id === newMessage.chat_room_id
                );
                if (newRoom) {
                  setSelectedRoom(newRoom);
                  setSearchParams({ room: String(newRoom.id) });
                }
              });
            },
          }
        );
      }
    },
    [selectedRoom, currentUserId, sendMutation, newChatRestaurantId, refetchRooms, setSearchParams, setSelectedRoom, setNewChatRestaurantId]
  );

  const handleSendImages = useCallback(
    (images: File[]) => {
      if (!currentUserId) return;

      const restaurantId = selectedRoom?.restaurant.id ?? newChatRestaurantId;
      if (!restaurantId) return;

      const isOwnerSending = selectedRoom ? selectedRoom.user.id !== currentUserId : false;

      sendImageMutation.mutate(
        {
          restaurantId,
          images,
          roomId: isOwnerSending && selectedRoom ? selectedRoom.id : undefined,
        },
        {
          onSuccess: (newMessage) => {
            if (newChatRestaurantId) {
              setNewChatRestaurantId(null);
              refetchRooms().then(({ data: updatedRooms }) => {
                const newRoom = updatedRooms?.find(
                  (r) => r.id === newMessage.chat_room_id
                );
                if (newRoom) {
                  setSelectedRoom(newRoom);
                  setSearchParams({ room: String(newRoom.id) });
                }
              });
            }
          },
        }
      );
    },
    [selectedRoom, currentUserId, sendImageMutation, newChatRestaurantId, refetchRooms, setSearchParams, setSelectedRoom, setNewChatRestaurantId]
  );

  const handleHideMessage = useCallback(
    (messageId: number) => {
      if (!confirm('このメッセージを削除しますか？（自分の画面からのみ削除されます）')) return;
      hideMessageMutation.mutate(messageId);
    },
    [hideMessageMutation]
  );

  const handleHideRoom = useCallback(
    (roomId: number) => {
      if (!confirm('このチャットを削除しますか？（自分の画面からのみ削除されます）')) return;
      hideRoomMutation.mutate(roomId, {
        onSuccess: () => {
          if (selectedRoom?.id === roomId) {
            setSelectedRoom(null);
            setMobileView('list');
          }
        },
      });
    },
    [hideRoomMutation, selectedRoom, setSelectedRoom, setMobileView]
  );

  const handleBlock = useCallback(() => {
    if (!otherUserId || !restaurantId) return;
    if (blockStatus?.blocking) {
      if (!confirm('ブロックを解除しますか？')) return;
      unblockMutation.mutate({ restaurantId, userId: otherUserId });
    } else {
      if (!confirm('このユーザーをブロックしますか？\nブロックするとこの店舗でのメッセージの送受信ができなくなります。')) return;
      blockMutation.mutate({ restaurantId, userId: otherUserId });
    }
  }, [otherUserId, restaurantId, blockStatus, blockMutation, unblockMutation]);

  const handleReportUser = useCallback(() => {
    if (!otherUserId) return;
    if (reportStatus?.reported) return;
    setReportTarget({ type: 'user', id: otherUserId });
  }, [otherUserId, reportStatus]);

  const handleReportMessage = useCallback((messageId: number) => {
    setReportTarget({ type: 'chat_message', id: messageId });
  }, []);

  const handleReportSubmit = useCallback(
    (reason: string) => {
      if (!reportTarget) return;
      reportMutation.mutate(
        { targetUserId: reportTarget.id, reason },
        {
          onSuccess: () => {
            setReportTarget(null);
            alert('通報を受け付けました。');
          },
        }
      );
    },
    [reportTarget, reportMutation]
  );

  const handleBack = useCallback(() => {
    if (isOwner && selectedRoom && !selectedRestaurantId) {
      setMobileView('list');
      setSelectedRoom(null);
      setNewChatRestaurantId(null);
    } else if (isOwner && selectedRestaurantId && mobileView === 'chat') {
      setMobileView('list');
      setSelectedRoom(null);
      setNewChatRestaurantId(null);
    } else {
      setMobileView('list');
      setNewChatRestaurantId(null);
    }
  }, [isOwner, selectedRoom, selectedRestaurantId, mobileView, setMobileView, setSelectedRoom, setNewChatRestaurantId]);

  return {
    sendMutation,
    sendImageMutation,
    blockStatus: blockStatus as BlockStatus | undefined,
    reportStatus: reportStatus as ReportStatus | undefined,
    reportTarget,
    reportMutation,
    setReportTarget,
    handleSend,
    handleSendImages,
    handleHideMessage,
    handleHideRoom,
    handleBlock,
    handleReportUser,
    handleReportMessage,
    handleReportSubmit,
    handleBack,
  };
}
