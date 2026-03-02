import { useState, useRef, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react';

interface Props {
  onSend: (body: string) => void;
  onSendImages?: (images: File[]) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onSendImages, disabled }: Props) {
  const [text, setText] = useState('');
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 送信中の二重送信を防止するフラグ
  const sendingRef = useRef(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled || sendingRef.current) return;

    if (previews.length > 0) {
      sendingRef.current = true;
      onSendImages?.(previews.map((p) => p.file));
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
      setText('');
      // 次のイベントループで解除（React state 更新を待つ）
      setTimeout(() => { sendingRef.current = false; }, 0);
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;
    sendingRef.current = true;
    onSend(trimmed);
    setText('');
    setTimeout(() => { sendingRef.current = false; }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // IME変換中（日本語入力の確定Enterなど）は送信しない
    if (e.nativeEvent.isComposing || e.key === 'Process') return;
    // Enter で送信、Shift+Enter で改行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews = files.slice(0, 5 - previews.length).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 5));

    // input をリセット（同じファイルを再選択可能にする）
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white">
      {/* 画像プレビュー */}
      {previews.length > 0 && (
        <div className="px-3 pt-3 flex gap-2 flex-wrap">
          {previews.map((p, i) => (
            <div key={i} className="relative">
              <img
                src={p.url}
                alt=""
                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removePreview(i)}
                className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-gray-800"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 flex items-end gap-2">
        {/* 画像添付ボタン */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || previews.length >= 5}
          className="text-gray-400 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed p-2 flex-shrink-0 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          rows={1}
          className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent max-h-32"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || (!text.trim() && previews.length === 0)}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-bold transition flex-shrink-0"
        >
          送信
        </button>
      </div>
    </form>
  );
}
