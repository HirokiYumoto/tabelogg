export interface ChatRoom {
  id: number;
  restaurant: {
    id: number;
    name: string;
    image: string | null;
    user_id: number;
  };
  user: {
    id: number;
    name: string;
  };
  latest_message: {
    id: number;
    type: 'text' | 'image';
    body: string | null;
    sender_id: number;
    created_at: string;
  } | null;
  unread_count: number;
  created_at: string;
}

export interface ChatMessageImage {
  id: number;
  url: string;
}

export interface ChatMessage {
  id: number;
  chat_room_id: number;
  sender_id: number;
  sender_name: string;
  type: 'text' | 'image';
  body: string | null;
  images?: ChatMessageImage[];
  is_read: boolean;
  created_at: string;
}

export interface ChatMessagesResponse {
  data: ChatMessage[];
  next_cursor: number | null;
}

export interface BlockStatus {
  blocking: boolean;
  blocked_by: boolean;
}

export interface ReportStatus {
  reported: boolean;
}
