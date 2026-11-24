// Message types
export interface Message {
  id: string;
  nickname: string;
  text: string;
  ts: number;
}

// WebSocket message types
export type ClientMessage =
  | { type: 'join'; nickname: string; lastMessageId?: string }
  | { type: 'message'; id: string; text: string }
  | { type: 'typing' };

export type ServerMessage =
  | { type: 'history'; messages: Message[]; presence: string[] }
  | { type: 'message'; msg: Message }
  | { type: 'presence'; nicknames: string[] }
  | { type: 'typing'; nickname: string }
  | { type: 'error'; code: 'RATE_LIMIT' | 'INVALID_INPUT' | string };

// Connection status
export type ConnectionStatus = 'ONLINE' | 'RECONNECTING' | 'OFFLINE';

// Room state
export interface RoomState {
  messages: Message[];
  presence: string[];
  typingUsers: Set<string>;
  connectionStatus: ConnectionStatus;
  newMessagesCount: number;
  isAtBottom: boolean;
}
