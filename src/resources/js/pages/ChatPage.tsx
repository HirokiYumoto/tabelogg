import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChatRooms, useChatMessages, useSendMessage, useMarkRead, useChatSubscription } from '@/hooks/useChat';
import ChatRoomList from '@/components/chat/ChatRoomList';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import Spinner from '@/components/ui/Spinner';
import type { ChatRoom } from '@/types/chat';

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  // 新規チャット用（まだルームが存在しない場合）
  const [newChatRestaurantId, setNewChatRestaurantId] = useState<number | null>(null);

  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } = useChatRooms();

  const {
    data: messagesData,
    isLoading: messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useChatMessages(selectedRoom?.id ?? null);

  const sendMutation = useSendMessage();
  const markReadMutation = useMarkRead(selectedRoom?.id ?? null);

  // Echo でリアルタイム受信
  useChatSubscription(selectedRoom?.id ?? null);

  // URL パラメータから初期ルームを選択
  useEffect(() => {
    if (!rooms) return;

    const roomIdParam = searchParams.get('room');
    if (roomIdParam) {
      const found = rooms.find((r) => r.id === Number(roomIdParam));
      if (found) {
        setSelectedRoom(found);
        setMobileView('chat');
        return;
      }
    }

    // ?restaurant=123 の場合：既存ルームがあればそれを選択、なければ新規チャットモード
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
  }, [rooms, searchParams]);

  // ルーム選択時に既読処理
  useEffect(() => {
    if (selectedRoom && selectedRoom.unread_count > 0) {
      markReadMutation.mutate();
    }
  }, [selectedRoom?.id]);

  const allMessages = messagesData?.pages.flatMap((page) => page.data) ?? [];

  const handleSelectRoom = useCallback((room: ChatRoom) => {
    setSelectedRoom(room);
    setNewChatRestaurantId(null);
    setMobileView('chat');
  }, []);

  const handleSend = useCallback(
    (body: string) => {
      if (!user) return;

      if (selectedRoom) {
        // 既存ルームへの送信
        const isOwner = selectedRoom.user.id !== user.id;
        sendMutation.mutate(
          {
            restaurantId: selectedRoom.restaurant.id,
            body,
            roomId: isOwner ? selectedRoom.id : undefined,
          },
          {
            onSuccess: () => {
              refetchRooms();
            },
          }
        );
      } else if (newChatRestaurantId) {
        // 新規ルーム作成（初回メッセージ送信）
        sendMutation.mutate(
          {
            restaurantId: newChatRestaurantId,
            body,
          },
          {
            onSuccess: (newMessage) => {
              setNewChatRestaurantId(null);
              // ルーム一覧を再取得して、新しいルームを選択
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
    [selectedRoom, user, sendMutation, newChatRestaurantId, refetchRooms, setSearchParams]
  );

  const handleBack = useCallback(() => {
    setMobileView('list');
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
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-lg text-gray-800">チャット</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ChatRoomList
              rooms={rooms ?? []}
              selectedRoomId={selectedRoom?.id ?? null}
              onSelect={handleSelectRoom}
              currentUserId={user.id}
            />
          </div>
        </div>

        {/* メイン: メッセージ表示 */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedRoom ? (
            <>
              {/* ヘッダー */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="md:hidden text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {selectedRoom.restaurant.image ? (
                    <img
                      src={`/storage/${selectedRoom.restaurant.image}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs font-bold">
                      {selectedRoom.restaurant.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-gray-800 truncate">
                    {selectedRoom.user.id === user.id
                      ? selectedRoom.restaurant.name
                      : selectedRoom.user.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {selectedRoom.restaurant.name}
                  </div>
                </div>
              </div>

              {/* メッセージ */}
              <ChatMessages
                messages={allMessages}
                currentUserId={user.id}
                isLoading={messagesLoading}
                hasMore={!!hasNextPage}
                onLoadMore={() => fetchNextPage()}
                isFetchingMore={isFetchingNextPage}
              />

              {/* 入力 */}
              <ChatInput onSend={handleSend} disabled={sendMutation.isPending} />
            </>
          ) : newChatRestaurantId ? (
            <>
              {/* 新規チャット ヘッダー */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="md:hidden text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="font-bold text-sm text-gray-800">新しいチャット</div>
              </div>

              {/* 空のメッセージエリア */}
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                メッセージを送信して会話を始めましょう
              </div>

              {/* 入力 */}
              <ChatInput onSend={handleSend} disabled={sendMutation.isPending} />
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
    </div>
  );
}
