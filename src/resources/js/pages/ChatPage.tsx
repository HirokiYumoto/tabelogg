import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  useChatRooms,
  useChatMessages,
  useMarkRead,
  useChatSubscription,
} from '@/hooks/useChat';
import { useChatPageActions } from '@/hooks/useChatPageActions';
import ChatRoomList from '@/components/chat/ChatRoomList';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import ReportModal from '@/components/chat/ReportModal';
import Spinner from '@/components/ui/Spinner';
import type { ChatRoom } from '@/types/chat';

interface RestaurantGroup {
  id: number;
  name: string;
  image: string | null;
  unreadCount: number;
  roomCount: number;
}

export default function ChatPage() {
  const { user, isOwner } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [newChatRestaurantId, setNewChatRestaurantId] = useState<number | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } = useChatRooms(true);

  const otherUserId = useMemo(() => {
    if (!selectedRoom || !user) return null;
    if (selectedRoom.user.id !== user.id) return selectedRoom.user.id;
    return selectedRoom.restaurant.user_id;
  }, [selectedRoom, user]);

  const restaurantGroups = useMemo<RestaurantGroup[]>(() => {
    if (!isOwner || !rooms) return [];
    const map = new Map<number, RestaurantGroup>();
    for (const room of rooms) {
      const r = room.restaurant;
      const existing = map.get(r.id);
      if (existing) {
        existing.unreadCount += room.unread_count;
        existing.roomCount += 1;
      } else {
        map.set(r.id, {
          id: r.id,
          name: r.name,
          image: r.image,
          unreadCount: room.unread_count,
          roomCount: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [isOwner, rooms]);

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    if (isOwner && selectedRestaurantId) {
      return rooms.filter((r) => r.restaurant.id === selectedRestaurantId);
    }
    return rooms;
  }, [rooms, isOwner, selectedRestaurantId]);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useChatMessages(selectedRoom?.id ?? null);

  const markReadMutation = useMarkRead(selectedRoom?.id ?? null);

  useChatSubscription(selectedRoom?.id ?? null, user?.id);

  const {
    sendMutation,
    sendImageMutation,
    blockStatus,
    reportStatus,
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
  } = useChatPageActions({
    selectedRoom,
    setSelectedRoom,
    newChatRestaurantId,
    setNewChatRestaurantId,
    setMobileView,
    refetchRooms,
    currentUserId: user?.id,
    otherUserId,
    isOwner,
    selectedRestaurantId,
    mobileView,
  });

  // URL パラメータから初期ルームを選択
  useEffect(() => {
    if (!rooms) return;

    const roomIdParam = searchParams.get('room');
    if (roomIdParam) {
      const found = rooms.find((r) => r.id === Number(roomIdParam));
      if (found) {
        if (isOwner) setSelectedRestaurantId(found.restaurant.id);
        setSelectedRoom(found);
        setMobileView('chat');
        return;
      }
    }

    const restaurantParam = searchParams.get('restaurant');
    if (restaurantParam) {
      const restaurantId = Number(restaurantParam);
      const existingRoom = rooms.find((r) => r.restaurant.id === restaurantId);
      if (existingRoom) {
        setSelectedRoom(existingRoom);
        setMobileView('chat');
        setNewChatRestaurantId(null);
      } else {
        setNewChatRestaurantId(restaurantId);
        setSelectedRoom(null);
        setMobileView('chat');
      }
    }
  }, [rooms, searchParams, isOwner]);

  useEffect(() => {
    if (selectedRoom && selectedRoom.unread_count > 0) {
      markReadMutation.mutate(selectedRoom.unread_count);
    }
  }, [selectedRoom?.id]);

  const allMessages = useMemo(() => {
    const raw = messagesData?.pages.flatMap((page) => page.data) ?? [];
    const seen = new Set<number>();
    return raw.filter((msg) => {
      const id = Number(msg.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [messagesData]);

  const handleSelectRoom = useCallback((room: ChatRoom) => {
    setSelectedRoom(room);
    setNewChatRestaurantId(null);
    setMobileView('chat');
  }, []);

  const handleBackToRestaurants = useCallback(() => {
    setSelectedRestaurantId(null);
    setSelectedRoom(null);
    setNewChatRestaurantId(null);
  }, []);

  if (!user) return null;

  if (roomsLoading) {
    return <Spinner className="py-20" />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="flex h-full">
        {/* サイドバー: ルーム一覧 */}
        <div
          className={`w-full md:w-80 md:flex-shrink-0 border-r border-gray-200 flex flex-col ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {isOwner && !selectedRestaurantId ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-bold text-lg text-gray-800">チャット</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {restaurantGroups.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    チャットはまだありません
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {restaurantGroups.map((rg) => (
                      <button
                        key={rg.id}
                        type="button"
                        onClick={() => setSelectedRestaurantId(rg.id)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {rg.image ? (
                            <img src={`/storage/${rg.image}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-400 text-sm font-bold">{rg.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-800 truncate">{rg.name}</span>
                            {rg.unreadCount > 0 && (
                              <span className="ml-2 flex-shrink-0 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {rg.unreadCount > 9 ? '9+' : rg.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{rg.roomCount}件のチャット</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                {isOwner && selectedRestaurantId && (
                  <button type="button" onClick={handleBackToRestaurants} className="text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <h2 className="font-bold text-lg text-gray-800">
                  {isOwner && selectedRestaurantId
                    ? restaurantGroups.find((rg) => rg.id === selectedRestaurantId)?.name ?? 'チャット'
                    : 'チャット'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ChatRoomList
                  rooms={filteredRooms}
                  selectedRoomId={selectedRoom?.id ?? null}
                  onSelect={handleSelectRoom}
                  currentUserId={user.id}
                  onHideRoom={handleHideRoom}
                />
              </div>
            </>
          )}
        </div>

        {/* メイン: メッセージ表示 */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedRoom ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                <button type="button" onClick={handleBack} className="md:hidden text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {selectedRoom.restaurant.image ? (
                    <img src={`/storage/${selectedRoom.restaurant.image}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs font-bold">{selectedRoom.restaurant.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-gray-800 truncate">
                    {selectedRoom.user.id === user.id ? selectedRoom.restaurant.name : selectedRoom.user.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{selectedRoom.restaurant.name}</div>
                </div>

                {otherUserId && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleBlock}
                      className={`text-xs px-2 py-1 rounded-lg transition ${
                        blockStatus?.blocking
                          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {blockStatus?.blocking ? 'ブロック中' : 'ブロック'}
                    </button>
                    <button
                      type="button"
                      onClick={handleReportUser}
                      disabled={!!reportStatus?.reported}
                      className={`text-xs px-2 py-1 rounded-lg transition ${
                        reportStatus?.reported
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {reportStatus?.reported ? '通報済み' : '通報'}
                    </button>
                  </div>
                )}
              </div>

              {blockStatus?.blocked_by && (
                <div className="px-4 py-2 bg-red-50 text-red-600 text-xs text-center">
                  相手にブロックされているため、メッセージを送信できません。
                </div>
              )}
              {blockStatus?.blocking && !blockStatus?.blocked_by && (
                <div className="px-4 py-2 bg-gray-50 text-gray-500 text-xs text-center">
                  ブロック中のため、メッセージを送信できません。
                </div>
              )}
              {reportStatus?.reported && (
                <div className="px-4 py-2 bg-yellow-50 text-yellow-700 text-xs text-center">
                  すでに通報済みです
                </div>
              )}

              <ChatMessages
                messages={allMessages}
                currentUserId={user.id}
                isLoading={messagesLoading}
                hasMore={!!hasNextPage}
                onLoadMore={() => fetchNextPage()}
                isFetchingMore={isFetchingNextPage}
                onHideMessage={handleHideMessage}
                onReportMessage={handleReportMessage}
              />

              <ChatInput
                onSend={handleSend}
                onSendImages={handleSendImages}
                disabled={
                  sendMutation.isPending ||
                  sendImageMutation.isPending ||
                  !!blockStatus?.blocking ||
                  !!blockStatus?.blocked_by
                }
              />
            </>
          ) : newChatRestaurantId ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                <button type="button" onClick={handleBack} className="md:hidden text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="font-bold text-sm text-gray-800">新しいチャット</div>
              </div>

              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                メッセージを送信して会話を始めましょう
              </div>

              <ChatInput
                onSend={handleSend}
                onSendImages={handleSendImages}
                disabled={sendMutation.isPending || sendImageMutation.isPending}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">チャットルームを選択してください</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onSubmit={handleReportSubmit}
          onClose={() => setReportTarget(null)}
          isSubmitting={reportMutation.isPending}
        />
      )}
    </div>
  );
}
