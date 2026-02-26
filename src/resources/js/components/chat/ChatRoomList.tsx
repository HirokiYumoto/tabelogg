import type { ChatRoom } from '@/types/chat';

interface Props {
  rooms: ChatRoom[];
  selectedRoomId: number | null;
  onSelect: (room: ChatRoom) => void;
  currentUserId: number;
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

export default function ChatRoomList({ rooms, selectedRoomId, onSelect, currentUserId }: Props) {
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
        const subtitle =
          room.user.id === currentUserId ? room.user.name : room.restaurant.name;

        return (
          <button
            key={room.id}
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
                  {room.latest_message?.body ?? 'メッセージなし'}
                </p>
                {room.unread_count > 0 && (
                  <span className="ml-2 flex-shrink-0 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {room.unread_count > 9 ? '9+' : room.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
