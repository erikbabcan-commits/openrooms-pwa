// Durable Object representing a chat room
// Manages WebSocket connections, presence, message history, rate limiting, and moderation

interface Message {
  id: string;
  nickname: string;
  text: string;
  ts: number;
}

interface Report {
  messageId: string;
  reporter: string;
  reportedNickname: string;
  reason?: string;
  ts: number;
}

interface ClientMessage {
  type: 'join' | 'message' | 'typing' | 'report';
  nickname?: string;
  lastMessageId?: string;
  id?: string;
  text?: string;
  messageId?: string;
  reportedNickname?: string;
  reason?: string;
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

export class Room {
  // State stored in memory (persists while DO is active)
  private sockets: Map<string, SocketInfo> = new Map();
  private messages: Message[] = [];
  private reports: Report[] = [];
  private blockedUsers: Map<string, number> = new Map(); // nickname -> expiresAt
  private MAX_MESSAGES = 100;
  private RATE_LIMIT = 5; // messages per RATE_WINDOW
  private RATE_WINDOW = 10000; // 10 seconds in ms

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

    server.addEventListener('message', (event) => {
      try {
        const data: ClientMessage = JSON.parse(event.data as string);
        
        switch (data.type) {
          case 'join':
            this.handleJoin(socketId, server, data.nickname, data.lastMessageId);
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

  // Handle join event
  private handleJoin(
    socketId: string,
    socket: WebSocket,
    nickname: string,
    lastMessageId?: string
  ): void {
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

    // Send history and presence
    const historyMessages = lastMessageId
      ? this.messages.filter((msg) => msg.id > lastMessageId)
      : this.messages.slice(-this.MAX_MESSAGES);

    const historyResponse: ServerMessage = {
      type: 'history',
      messages: historyMessages,
      presence: this.getPresence(),
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
