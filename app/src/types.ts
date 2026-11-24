// Message types
export interface Message {
  id: string;
  nickname: string;
  text: string;
  ts: number;
}

// Report types
export interface Report {
  messageId: string;
  reporter: string;
  reportedNickname: string;
  reason?: string;
  ts: number;
}

// Block types
export interface BlockInfo {
  nickname: string;
  blockedAt: number;
  expiresAt?: number; // For server-side temp blocks
}

// History response with pagination
export interface HistoryResponse {
  messages: Message[];
  presence: string[];
  hasMore?: boolean;
  nextCursor?: string;
}

// WebSocket message types
export type ClientMessage =
  | { type: 'join'; nickname: string; lastMessageId?: string }
  | { type: 'message'; id: string; text: string }
  | { type: 'typing' }
  | { type: 'report'; messageId: string; reportedNickname: string; reason?: string }
  | { type: 'history'; cursor?: string };

export type ServerMessage =
  | { type: 'history'; messages: Message[]; presence: string[]; hasMore?: boolean; nextCursor?: string }
  | { type: 'message'; msg: Message }
  | { type: 'presence'; nicknames: string[] }
  | { type: 'typing'; nickname: string }
  | { type: 'blocked'; nickname: string; duration: number; reason: string }
  | { type: 'error'; code: 'RATE_LIMIT' | 'INVALID_INPUT' | 'BLOCKED' | 'FILTERED' | string };

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
