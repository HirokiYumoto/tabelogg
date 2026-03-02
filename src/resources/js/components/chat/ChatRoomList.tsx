import { useState } from 'react';
import type { ChatRoom } from '@/types/chat';

interface Props {
  rooms: ChatRoom[];
  selectedRoomId: number | null;
  onSelect: (room: ChatRoom) => void;
  currentUserId: number;
  onHideRoom?: (roomId: number) => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isToday) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function latestMessagePreview(room: ChatRoom): string {
  if (!room.latest_message) return 'メッセージなし';
  if (room.latest_message.type === 'image') return '画像を送信しました';
  return room.latest_message.body ?? 'メッセージなし';
}

export default function ChatRoomList({ rooms, selectedRoomId, onSelect, currentUserId, onHideRoom }: Props) {
  const [menuRoomId, setMenuRoomId] = useState<number | null>(null);

  if (rooms.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        チャットはまだありません
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {rooms.map((room) => {
        const isSelected = room.id === selectedRoomId;
        // 相手の名前を表示（自分がオーナーならユーザー名、ユーザーなら店舗名）
        const displayName =
          room.user.id === currentUserId ? room.restaurant.name : room.user.name;

        return (
          <div key={room.id} className="relative group">
            <button
              type="button"
              onClick={() => onSelect(room)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3 ${
                isSelected ? 'bg-orange-50 border-l-4 border-orange-500' : ''
              }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                {room.restaurant.image ? (
                  <img
                    src={`/storage/${room.restaurant.image}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm font-bold">
                    {displayName.charAt(0)}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800 truncate">
                    {displayName}
                  </span>
                  {room.latest_message && (
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(room.latest_message.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500 truncate">
                    {latestMessagePreview(room)}
                  </p>
                  {room.unread_count > 0 && (
                    <span className="ml-2 flex-shrink-0 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {room.unread_count > 9 ? '9+' : room.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* ルーム削除ボタン */}
            {onHideRoom && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuRoomId(menuRoomId === room.id ? null : room.id);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
            )}

            {/* ルームメニュー */}
            {menuRoomId === room.id && (
              <div
                className="absolute right-2 top-8 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[100px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    onHideRoom?.(room.id);
                    setMenuRoomId(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-50"
                >
                  削除
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
