export interface ChatRoom {
  id: number;
  restaurant: {
    id: number;
    name: string;
    image: string | null;
  };
  user: {
    id: number;
    name: string;
  };
  latest_message: {
    id: number;
    body: string;
    sender_id: number;
    created_at: string;
  } | null;
  unread_count: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  chat_room_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessagesResponse {
  data: ChatMessage[];
  next_cursor: number | null;
}
