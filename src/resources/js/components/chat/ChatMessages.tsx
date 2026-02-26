import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/chat';
import Spinner from '@/components/ui/Spinner';

interface Props {
  messages: ChatMessage[];
  currentUserId: number;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isFetchingMore: boolean;
}

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateSeparator(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export default function ChatMessages({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  isFetchingMore,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // 新着メッセージ時に下にスクロール
  useEffect(() => {
    if (messages.length > prevLengthRef.current && prevLengthRef.current > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (prevLengthRef.current === 0 && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        メッセージを送信して会話を始めましょう
      </div>
    );
  }

  // メッセージは id 降順で取得されるので反転して時系列順に
  const sorted = [...messages].sort((a, b) => a.id - b.id);

  // 日付区切り用
  let lastDate = '';

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
      {/* もっと読み込む */}
      {hasMore && (
        <div className="text-center py-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="text-xs text-orange-500 hover:text-orange-600 font-bold disabled:opacity-50"
          >
            {isFetchingMore ? '読み込み中...' : '過去のメッセージを読み込む'}
          </button>
        </div>
      )}

      {sorted.map((msg) => {
        const isMine = msg.sender_id === currentUserId;
        const dateStr = formatDateSeparator(msg.created_at);
        let showDate = false;
        if (dateStr !== lastDate) {
          showDate = true;
          lastDate = dateStr;
        }

        return (
          <div key={msg.id}>
            {showDate && (
              <div className="text-center my-3">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {dateStr}
                </span>
              </div>
            )}
            <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                  isMine
                    ? 'bg-orange-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {!isMine && (
                  <div className="text-xs font-bold text-gray-500 mb-0.5">
                    {msg.sender_name}
                  </div>
                )}
                <div>{msg.body}</div>
                <div
                  className={`text-[10px] mt-1 ${
                    isMine ? 'text-orange-200' : 'text-gray-400'
                  }`}
                >
                  {formatMessageTime(msg.created_at)}
                  {isMine && msg.is_read && ' 既読'}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
