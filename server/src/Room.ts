// Durable Object representing a chat room
// Manages WebSocket connections, presence, message history, rate limiting, and moderation

import { D1Database } from '@cloudflare/workers-types/experimental';

interface Message {
  id: string;
  nickname: string;
  text: string;
  ts: number;
}

interface StoredMessage {
  id: string;
  room: string;
  nickname: string;
  text: string;
  ts: number;
  clientId?: string;
}

interface Report {
  messageId: string;
  reporter: string;
  reportedNickname: string;
  reason?: string;
  ts: number;
}

interface ClientMessage {
  type: 'join' | 'message' | 'typing' | 'report' | 'history';
  nickname?: string;
  lastMessageId?: string;
  id?: string;
  text?: string;
  messageId?: string;
  reportedNickname?: string;
  reason?: string;
  cursor?: string;
}

interface ServerMessage {
  type: 'history' | 'message' | 'presence' | 'typing' | 'error' | 'blocked';
  messages?: Message[];
  presence?: string[];
  msg?: Message;
  nicknames?: string[];
  nickname?: string;
  code?: string;
  reason?: string;
  duration?: number;
  hasMore?: boolean;
  nextCursor?: string;
}

interface SocketInfo {
  socket: WebSocket;
  nickname: string;
  lastMessageTime: number;
  messageCount: number;
}

// Blacklist of forbidden words (configurable)
const BLACKLIST = [
  'fuck',
  'shit',
  'cunt',
  'bitch',
  'asshole',
  'dick',
  'pussy',
  'whore',
  'slut',
  'bastard',
  'motherfucker',
  'cock',
  'twat',
  'wanker',
  'arsehole',
];

// Report threshold for auto-block
const REPORT_THRESHOLD = 3;
const BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// Message limits
const MAX_MESSAGES_IN_MEMORY = 100;
const MAX_MESSAGES_IN_DB = 1000;
const MAX_HISTORY_PER_REQUEST = 100;
const MESSAGE_RETENTION_DAYS = 7;

export class Room {
  // State stored in memory (persists while DO is active)
  private sockets: Map<string, SocketInfo> = new Map();
  private messages: Message[] = [];
  private reports: Report[] = [];
  private blockedUsers: Map<string, number> = new Map(); // nickname -> expiresAt
  private MAX_MESSAGES = 100;
  private RATE_LIMIT = 5; // messages per RATE_WINDOW
  private RATE_WINDOW = 10000; // 10 seconds in ms
  
  // Room name (from DO id)
  private roomName: string;
  
  // D1 Database
  private db: D1Database;

  constructor(state: DurableObjectState, env: { DB: D1Database }) {
    this.roomName = state.id.toString();
    this.db = env.DB;
    
    // Initialize from D1 on startup
    this.initializeFromDB();
  }

  // Initialize in-memory state from D1
  private async initializeFromDB(): Promise<void> {
    try {
      await this.ensureTableExists();
      
      // Load recent messages
      const recentMessages = await this.loadMessagesFromDB(0, MAX_MESSAGES_IN_MEMORY);
      this.messages = recentMessages;
      
      // Load reports
      const reports = await this.loadReportsFromDB();
      this.reports = reports;
      
      // Check for expired blocks
      this.cleanupExpiredBlocks();
    } catch (e) {
      console.error('Failed to initialize from DB:', e);
    }
  }

  // Generate unique socket ID
  private generateSocketId(): string {
    return crypto.randomUUID();
  }

  // Check if text contains blacklisted words
  private containsBlacklistedWords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return BLACKLIST.some((word) => lowerText.includes(word));
  }

  // Check if user is blocked
  private isUserBlocked(nickname: string): boolean {
    const expiresAt = this.blockedUsers.get(nickname);
    if (expiresAt === undefined) return false;
    return Date.now() < expiresAt;
  }

  // Block a user
  private blockUser(nickname: string, durationMs: number = BLOCK_DURATION_MS): void {
    this.blockedUsers.set(nickname, Date.now() + durationMs);
    
    // Remove user from sockets
    for (const [socketId, socketInfo] of this.sockets) {
      if (socketInfo.nickname === nickname) {
        socketInfo.socket.close();
        this.sockets.delete(socketId);
        break;
      }
    }
    
    // Broadcast block notification
    this.broadcast({
      type: 'blocked',
      nickname,
      duration: durationMs,
      reason: 'Too many reports',
    });
  }

  // Count reports for a user
  private getReportCount(nickname: string): number {
    return this.reports.filter((r) => r.reportedNickname === nickname).length;
  }

  // ============ D1 Database Operations ============

  // Ensure messages table exists
  private async ensureTableExists(): Promise<void> {
    try {
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          room TEXT NOT NULL,
          nickname TEXT NOT NULL,
          text TEXT NOT NULL,
          ts INTEGER NOT NULL,
          clientId TEXT
        )
      `);
      
      // Create index on room and ts for efficient queries
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_messages_room_ts ON messages(room, ts DESC)
      `);
      
      // Create reports table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY,
          room TEXT NOT NULL,
          messageId TEXT NOT NULL,
          reporter TEXT NOT NULL,
          reportedNickname TEXT NOT NULL,
          reason TEXT,
          ts INTEGER NOT NULL
        )
      `);
      
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_reports_room ON reports(room)
      `);
    } catch (e) {
      console.error('Failed to create tables:', e);
    }
  }

  // Store message in D1
  private async storeMessageInDB(msg: StoredMessage): Promise<void> {
    try {
      await this.ensureTableExists();
      
      await this.db.prepare(`
        INSERT INTO messages (id, room, nickname, text, ts, clientId)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
        .bind(msg.id, msg.room, msg.nickname, msg.text, msg.ts, msg.clientId || '')
        .run();
      
      // Cleanup old messages if we exceed the limit
      await this.cleanupOldMessages();
    } catch (e) {
      console.error('Failed to store message in DB:', e);
    }
  }

  // Load messages from D1
  private async loadMessagesFromDB(limit: number, offset: number = 0): Promise<Message[]> {
    try {
      await this.ensureTableExists();
      
      const stmt = await this.db.prepare(`
        SELECT id, nickname, text, ts 
        FROM messages 
        WHERE room = ? 
        ORDER BY ts DESC 
        LIMIT ? OFFSET ?
      `)
        .bind(this.roomName, limit, offset)
        .all<Message>();
      
      return stmt.results || [];
    } catch (e) {
      console.error('Failed to load messages from DB:', e);
      return [];
    }
  }

  // Load messages after a specific cursor (for pagination)
  private async loadMessagesAfterCursor(cursor: string | null, limit: number): Promise<{ messages: Message[]; hasMore: boolean; nextCursor: string | null }> {
    try {
      await this.ensureTableExists();
      
      let messages: Message[] = [];
      let hasMore = false;
      let nextCursor: string | null = null;
      
      if (cursor) {
        // Load messages older than cursor
        const stmt = await this.db.prepare(`
          SELECT id, nickname, text, ts 
          FROM messages 
          WHERE room = ? AND ts < (
            SELECT ts FROM messages WHERE id = ?
          )
          ORDER BY ts DESC 
          LIMIT ?
        `)
          .bind(this.roomName, cursor, limit + 1)
          .all<Message>();
        
        messages = stmt.results || [];
        
        if (messages.length > limit) {
          hasMore = true;
          messages = messages.slice(0, limit);
          nextCursor = messages[messages.length - 1]?.id || null;
        }
      } else {
        // Load most recent messages
        const stmt = await this.db.prepare(`
          SELECT id, nickname, text, ts 
          FROM messages 
          WHERE room = ? 
          ORDER BY ts DESC 
          LIMIT ?
        `)
          .bind(this.roomName, limit + 1)
          .all<Message>();
        
        messages = stmt.results || [];
        
        if (messages.length > limit) {
          hasMore = true;
          messages = messages.slice(0, limit);
          nextCursor = messages[messages.length - 1]?.id || null;
        }
      }
      
      return { messages, hasMore, nextCursor };
    } catch (e) {
      console.error('Failed to load messages with cursor:', e);
      return { messages: [], hasMore: false, nextCursor: null };
    }
  }

  // Store report in D1
  private async storeReportInDB(report: Report): Promise<void> {
    try {
      await this.ensureTableExists();
      
      await this.db.prepare(`
        INSERT INTO reports (id, room, messageId, reporter, reportedNickname, reason, ts)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          crypto.randomUUID(),
          this.roomName,
          report.messageId,
          report.reporter,
          report.reportedNickname,
          report.reason || '',
          report.ts
        )
        .run();
    } catch (e) {
      console.error('Failed to store report in DB:', e);
    }
  }

  // Load reports from D1
  private async loadReportsFromDB(): Promise<Report[]> {
    try {
      await this.ensureTableExists();
      
      const stmt = await this.db.prepare(`
        SELECT messageId, reporter, reportedNickname, reason, ts 
        FROM reports 
        WHERE room = ?
        ORDER BY ts DESC
      `)
        .bind(this.roomName)
        .all<Report>();
      
      return stmt.results || [];
    } catch (e) {
      console.error('Failed to load reports from DB:', e);
      return [];
    }
  }

  // Cleanup old messages (>7 days)
  private async cleanupOldMessages(): Promise<void> {
    try {
      await this.ensureTableExists();
      
      const cutoff = Date.now() - (MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      
      // Delete messages older than 7 days
      await this.db.prepare(`
        DELETE FROM messages 
        WHERE room = ? AND ts < ?
      `)
        .bind(this.roomName, cutoff)
        .run();
      
      // Also cleanup old messages if we exceed MAX_MESSAGES_IN_DB
      const countStmt = await this.db.prepare(`
        SELECT COUNT(*) as count FROM messages WHERE room = ?
      `)
        .bind(this.roomName)
        .first<{ count: number }>();
      
      const count = countStmt?.count || 0;
      if (count > MAX_MESSAGES_IN_DB) {
        // Delete oldest messages to keep within limit
        const deleteCount = count - MAX_MESSAGES_IN_DB;
        await this.db.prepare(`
          DELETE FROM messages 
          WHERE room = ? AND id IN (
            SELECT id FROM messages 
            WHERE room = ? 
            ORDER BY ts ASC 
            LIMIT ?
          )
        `)
          .bind(this.roomName, this.roomName, deleteCount)
          .run();
      }
    } catch (e) {
      console.error('Failed to cleanup old messages:', e);
    }
  }

  // Cleanup expired blocks
  private cleanupExpiredBlocks(): void {
    const now = Date.now();
    for (const [nickname, expiresAt] of this.blockedUsers) {
      if (now >= expiresAt) {
        this.blockedUsers.delete(nickname);
      }
    }
  }

  // Broadcast message to all connected clients
  private broadcast(message: ServerMessage, excludeSocketId?: string): void {
    const messageStr = JSON.stringify(message);
    this.sockets.forEach((socketInfo, socketId) => {
      if (socketId !== excludeSocketId) {
        try {
          socketInfo.socket.send(messageStr);
        } catch (e) {
          console.error('Failed to send to socket:', socketId, e);
        }
      }
    });
  }

  // Add message to history
  private addMessage(msg: Message): void {
    this.messages.push(msg);
    if (this.messages.length > this.MAX_MESSAGES) {
      this.messages.shift();
    }
    
    // Store in D1
    this.storeMessageInDB({
      id: msg.id,
      room: this.roomName,
      nickname: msg.nickname,
      text: msg.text,
      ts: msg.ts,
    });
  }

  // Check rate limit for a socket
  private checkRateLimit(socketId: string): boolean {
    const socketInfo = this.sockets.get(socketId);
    if (!socketInfo) return true; // Allow if socket not found

    const now = Date.now();
    const windowStart = now - this.RATE_WINDOW;

    // Reset count if outside window
    if (socketInfo.lastMessageTime < windowStart) {
      socketInfo.messageCount = 0;
      socketInfo.lastMessageTime = now;
    }

    // Check if rate limit exceeded
    if (socketInfo.messageCount >= this.RATE_LIMIT) {
      return false;
    }

    // Increment count
    socketInfo.messageCount++;
    socketInfo.lastMessageTime = now;
    return true;
  }

  // Get presence list
  private getPresence(): string[] {
    return Array.from(this.sockets.values()).map((socketInfo) => socketInfo.nickname);
  }

  // Handle WebSocket connection
  async fetch(request: Request): Promise<Response> {
    // Only accept WebSocket upgrade requests
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    // Accept WebSocket connection
    const [client, server] = Object.values(new WebSocketPair());

    // Handle WebSocket messages
    server.accept();

    const socketId = this.generateSocketId();
    let socketInfo: SocketInfo | null = null;

    server.addEventListener('message', async (event) => {
      try {
        const data: ClientMessage = JSON.parse(event.data as string);
        
        switch (data.type) {
          case 'join':
            await this.handleJoin(socketId, server, data.nickname, data.lastMessageId);
            break;
            
          case 'message':
            this.handleMessage(socketId, data.id, data.text);
            break;
            
          case 'typing':
            this.handleTyping(socketId);
            break;
            
          case 'report':
            this.handleReport(socketId, data.messageId, data.reportedNickname, data.reason);
            break;
            
          case 'history':
            await this.handleHistoryRequest(socketId, data.cursor);
            break;
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
        this.sendError(server, 'INVALID_INPUT');
      }
    });

    server.addEventListener('close', () => {
      this.handleDisconnect(socketId);
    });

    server.addEventListener('error', (e) => {
      console.error('WebSocket error:', e);
      this.handleDisconnect(socketId);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  // Handle history request (for infinite scroll)
  private async handleHistoryRequest(socketId: string, cursor?: string): Promise<void> {
    const socketInfo = this.sockets.get(socketId);
    if (!socketInfo) return;

    try {
      const result = await this.loadMessagesAfterCursor(cursor || null, MAX_HISTORY_PER_REQUEST);
      
      const historyResponse: ServerMessage = {
        type: 'history',
        messages: result.messages,
        presence: this.getPresence(),
        hasMore: result.hasMore,
        nextCursor: result.nextCursor || undefined,
      };

      socketInfo.socket.send(JSON.stringify(historyResponse));
    } catch (e) {
      console.error('Failed to load history:', e);
      this.sendError(socketInfo.socket, 'INTERNAL_ERROR');
    }
  }

  // Handle join event
  private async handleJoin(
    socketId: string,
    socket: WebSocket,
    nickname: string,
    lastMessageId?: string
  ): Promise<void> {
    // Validate nickname
    if (!nickname || !/^[a-zA-Z0-9_-]{1,50}$/.test(nickname)) {
      this.sendError(socket, 'INVALID_INPUT');
      socket.close();
      return;
    }

    // Check if user is blocked
    if (this.isUserBlocked(nickname)) {
      this.sendError(socket, 'BLOCKED');
      socket.close();
      return;
    }

    // Check if nickname is already taken
    const existingNickname = Array.from(this.sockets.values()).find(
      (s) => s.nickname.toLowerCase() === nickname.toLowerCase()
    );

    if (existingNickname) {
      this.sendError(socket, 'NICKNAME_TAKEN');
      socket.close();
      return;
    }

    // Create socket info
    socketInfo = {
      socket,
      nickname,
      lastMessageTime: Date.now(),
      messageCount: 0,
    };

    this.sockets.set(socketId, socketInfo);

    // Load history with pagination support
    const result = await this.loadMessagesAfterCursor(lastMessageId || null, MAX_HISTORY_PER_REQUEST);

    const historyResponse: ServerMessage = {
      type: 'history',
      messages: result.messages,
      presence: this.getPresence(),
      hasMore: result.hasMore,
      nextCursor: result.nextCursor || undefined,
    };

    socket.send(JSON.stringify(historyResponse));

    // Broadcast presence update
    this.broadcast({
      type: 'presence',
      nicknames: this.getPresence(),
    }, socketId);
  }

  // Handle message event
  private handleMessage(socketId: string, messageId: string, text: string): void {
    const socketInfo = this.sockets.get(socketId);
    if (!socketInfo) return;

    // Validate message
    if (!text || text.length > 1000) {
      this.sendError(socketInfo.socket, 'INVALID_INPUT');
      return;
    }

    // Check if user is blocked
    if (this.isUserBlocked(socketInfo.nickname)) {
      this.sendError(socketInfo.socket, 'BLOCKED');
      return;
    }

    // Check rate limit
    if (!this.checkRateLimit(socketId)) {
      this.sendError(socketInfo.socket, 'RATE_LIMIT');
      return;
    }

    // Check for blacklisted words
    if (this.containsBlacklistedWords(text)) {
      this.sendError(socketInfo.socket, 'FILTERED');
      return;
    }

    // Create message
    const msg: Message = {
      id: messageId || crypto.randomUUID(),
      nickname: socketInfo.nickname,
      text,
      ts: Date.now(),
    };

    // Add to history
    this.addMessage(msg);

    // Broadcast message
    this.broadcast({
      type: 'message',
      msg,
    });
  }

  // Handle typing event
  private handleTyping(socketId: string): void {
    const socketInfo = this.sockets.get(socketId);
    if (!socketInfo) return;

    // Broadcast typing indicator
    this.broadcast({
      type: 'typing',
      nickname: socketInfo.nickname,
    }, socketId);
  }

  // Handle report event
  private handleReport(
    socketId: string,
    messageId: string | undefined,
    reportedNickname: string | undefined,
    reason: string | undefined
  ): void {
    const socketInfo = this.sockets.get(socketId);
    if (!socketInfo || !reportedNickname) return;

    // Create report
    const report: Report = {
      messageId: messageId || '',
      reporter: socketInfo.nickname,
      reportedNickname,
      reason,
      ts: Date.now(),
    };

    this.reports.push(report);
    
    // Store in D1
    this.storeReportInDB(report);

    // Check if user has too many reports
    const reportCount = this.getReportCount(reportedNickname);
    if (reportCount >= REPORT_THRESHOLD) {
      // Auto-block the user
      this.blockUser(reportedNickname, BLOCK_DURATION_MS);
    }

    // Send acknowledgment to reporter
    try {
      socketInfo.socket.send(JSON.stringify({
        type: 'message',
        msg: {
          id: crypto.randomUUID(),
          nickname: 'System',
          text: `Thank you for reporting. We'll review this.`,
          ts: Date.now(),
        },
      }));
    } catch (e) {
      console.error('Failed to send acknowledgment:', e);
    }
  }

  // Handle disconnect
  private handleDisconnect(socketId: string): void {
    const socketInfo = this.sockets.get(socketId);
    if (!socketInfo) return;

    this.sockets.delete(socketId);

    // Broadcast presence update
    this.broadcast({
      type: 'presence',
      nicknames: this.getPresence(),
    });
  }

  // Send error to socket
  private sendError(socket: WebSocket, code: string): void {
    const errorResponse: ServerMessage = {
      type: 'error',
      code,
    };
    try {
      socket.send(JSON.stringify(errorResponse));
    } catch (e) {
      console.error('Failed to send error:', e);
    }
  }
}
