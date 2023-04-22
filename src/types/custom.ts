export interface User {
  userId: number;
  socketId: string;
}

export interface Message {
  conversationId: number;
  sender_id: number;
  receiverId: number;
  message: string;
}

export interface FriendRequest {
  receiverId: number;
  senderId: number;
}

export interface Notification {
  id: number;
  first_name: string;
  last_name: string;
  image: string;
  type: string;
  created_at: Date;
  notification_id: number;
  receiver_id: number;
}

export interface Seen {
  sender_id: number;
  receiver_id: number;
  message_id: number;
  seen_at: Date;
}
