import { useState, type FormEvent } from 'react';

interface Props {
  targetType: string;
  targetId: number;
  onSubmit: (reason: string) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export default function ReportModal({ targetType, onSubmit, onClose, isSubmitting }: Props) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason.trim());
  };

  const label = targetType === 'user' ? 'ユーザー' : 'メッセージ';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg text-gray-800 mb-4">{label}を通報</h3>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-gray-600 mb-2">
            通報理由
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="通報理由を入力してください..."
            rows={4}
            maxLength={2000}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
            required
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
            >
              {isSubmitting ? '送信中...' : '通報する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
