import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/types/chat';
import Spinner from '@/components/ui/Spinner';

interface Props {
  messages: ChatMessage[];
  currentUserId: number;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isFetchingMore: boolean;
  onHideMessage?: (messageId: number) => void;
  onReportMessage?: (messageId: number) => void;
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
  onHideMessage,
  onReportMessage,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const [menuMessageId, setMenuMessageId] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // 新着メッセージ時に下にスクロール
  useEffect(() => {
    if (messages.length > prevLengthRef.current && prevLengthRef.current > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (prevLengthRef.current === 0 && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (menuMessageId === null) return;
    const handleClick = () => setMenuMessageId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuMessageId]);

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
            <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} group relative`}>
              {/* メッセージアクションボタン */}
              <div className={`flex items-center gap-1 ${isMine ? 'order-first' : 'order-last'}`}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuMessageId(menuMessageId === msg.id ? null : msg.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                  </svg>
                </button>
              </div>

              {/* コンテキストメニュー */}
              {menuMessageId === msg.id && (
                <div
                  className={`absolute z-10 top-0 ${isMine ? 'right-full mr-1' : 'left-full ml-1'} bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onHideMessage?.(msg.id);
                      setMenuMessageId(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    削除
                  </button>
                  {!isMine && (
                    <button
                      type="button"
                      onClick={() => {
                        onReportMessage?.(msg.id);
                        setMenuMessageId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-50"
                    >
                      通報
                    </button>
                  )}
                </div>
              )}

              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                  isMine
                    ? 'bg-orange-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {/* 画像メッセージ */}
                {msg.type === 'image' && msg.images && msg.images.length > 0 && (
                  <div className={`flex flex-wrap gap-1 ${msg.body ? 'mb-2' : ''}`}>
                    {msg.images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setLightboxUrl(img.url)}
                        className="block"
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="rounded-lg max-w-[200px] max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* テキスト */}
                {msg.body && <div>{msg.body}</div>}

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

      {/* 画像ライトボックス */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
