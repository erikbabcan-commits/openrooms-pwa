# Architecture

## System Overview

OpenRooms is a real-time chat application with the following architecture:

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│   Client    │───▶│ Cloudflare Pages │───▶│   PWA       │
│ (Browser)   │    │   (Static)      │    │   (Shell)   │
└─────────────┘    └─────────────────┘    └─────────────┘
       │                     │
       │                     ▼
       │              ┌─────────────────┐
       │              │ Cloudflare      │
       │              │ Worker          │
       │              │ (Routing)       │
       │              └────────┬────────┘
       │                       │
       ▼                       ▼
┌─────────────┐        ┌─────────────────┐
│ WebSocket   │───────▶│ Durable Object   │
│ Connection  │        │ (Room Instance)  │
└─────────────┘        └────────┬────────┘
                                  │
                                  ▼
                           ┌─────────────────┐
                           │   D1 Database    │
                           │ (Persistent      │
                           │  Message History)│
                           └─────────────────┘
```

## Frontend Architecture

### Component Tree
```
App
├── JoinScreen
│   └── NicknameInput + RoomSelector
└── Room
    ├── PresenceBar
    ├── MessageList
    │   └── MessageBubble (grouped)
    │       └── ContextMenu (block/report)
    ├── Composer
    ├── ConnectionStatus
    ├── RoomSwitcher
    └── BlockPanel
        └── BlockedUserList
```

### State Management

| State Type | Storage | Usage |
|------------|---------|-------|
| **Local state** | useState, useReducer | UI state, form inputs |
| **Server state** | WebSocket + useChatSocket | Messages, presence, typing |
| **Persistent state** | localStorage | Nickname, blocked users |
| **Session state** | Durable Object memory | Active connections, rate limits |
| **Persistent history** | D1 Database | Message history (1000/room) |

### Data Flow
```
User Action → Component → useChatSocket → WebSocket → DO → Broadcast → All Clients
```

### File Structure
```
app/
├── public/                   # Static assets (icons, manifest)
├── src/
│   ├── components/           # React components
│   │   ├── MessageList.tsx   # Message container with virtualization
│   │   ├── MessageBubble.tsx # Individual/grouped messages
│   │   ├── Composer.tsx      # Message input
│   │   ├── PresenceBar.tsx   # Online users
│   │   ├── ConnectionStatus.tsx # Connection state
│   │   ├── RoomSwitcher.tsx  # Room navigation
│   │   ├── ContextMenu.tsx   # Block/Report menu
│   │   ├── BlockPanel.tsx    # Blocked users management
│   │   └── Toast.tsx         # Notifications
│   ├── hooks/                # Custom hooks
│   │   ├── useChatSocket.ts  # WebSocket communication
│   │   ├── useVisualViewport.ts # Keyboard handling
│   │   ├── useLocalStorageNickname.ts # Nickname persistence
│   │   └── useBlockedUsers.ts # Client-side blocking
│   ├── lib/                  # Utilities
│   │   ├── escape.ts         # XSS protection
│   │   ├── outboundQueue.ts  # Offline queue
│   │   └── groupMessages.ts  # Message grouping
│   ├── routes/               # Page routes
│   │   ├── JoinScreen.tsx    # Join form
│   │   └── Room.tsx          # Chat room
│   ├── styles/               # CSS files
│   │   ├── global.css        # Global styles + variables
│   │   ├── MessageBubble.css # Message styling
│   │   ├── MessageList.css   # List styling
│   │   └── ...              # Component styles
│   ├── types.ts              # TypeScript types
│   ├── vite-env.d.ts         # Vite environment types
│   └── main.tsx              # App entry
├── index.html
├── vite.config.ts            # Vite + PWA configuration
└── package.json
```

## Backend Architecture

### Durable Object (Room)

Each Durable Object represents one chat room and maintains:

```typescript
class Room {
  // State
  private sockets: Map<string, SocketInfo>      // Active WebSocket connections
  private messages: Message[]                  // Last 100 messages (in-memory)
  private reports: Report[]                    // Report history
  private blockedUsers: Map<string, number>    // Blocked users (nickname → expiresAt)
  
  // Database
  private db: D1Database                       // D1 Database connection
  private roomName: string                     // Room identifier
  
  // Configuration
  private RATE_LIMIT: 5                        // Messages per 10 seconds
  private RATE_WINDOW: 10000                   // 10 seconds in ms
  private MAX_MESSAGES: 100                    // In-memory cache
  private MAX_MESSAGES_IN_DB: 1000             // D1 storage limit
  private MESSAGE_RETENTION_DAYS: 7            // Cleanup threshold
}
```

### State Lifecycle

```
Durable Object Creation
       │
       ▼
┌─────────────────┐
│  Initialize     │◄─────────────────────────┐
│  from D1        │                         │
└────────┬────────┘                         │
         │                                   │
         ▼                                   │
┌─────────────────┐                     ┌─────▼─────┐
│  Handle         │                     │   User   │
│  Connections    │◄────────────────────│  Actions  │
│  & Messages     │                     │ (Join,   │
└────────┬────────┘                     │  Message,│
         │                                   │  etc.)   │
         ▼                                   └─────────┘
┌─────────────────┐
│  Store in D1    │───────────────────────────▶ D1 Database
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Broadcast to    │
│  All Clients     │
└─────────────────┘
```

### D1 Database Schema

```sql
-- Messages table (persistent history)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,           -- Message UUID
  room TEXT NOT NULL,            -- Room name
  nickname TEXT NOT NULL,       -- Sender nickname
  text TEXT NOT NULL,            -- Message content
  ts INTEGER NOT NULL,           -- Timestamp (ms)
  clientId TEXT                 -- Optional client ID
);

-- Index for efficient pagination queries
CREATE INDEX IF NOT EXISTS idx_messages_room_ts 
ON messages(room, ts DESC);

-- Reports table (moderation)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,           -- Report UUID
  room TEXT NOT NULL,            -- Room name
  messageId TEXT NOT NULL,       -- Reported message ID
  reporter TEXT NOT NULL,       -- Who reported
  reportedNickname TEXT NOT NULL, -- Who was reported
  reason TEXT,                   -- Optional reason
  ts INTEGER NOT NULL            -- Timestamp (ms)
);

-- Index for room-specific reports
CREATE INDEX IF NOT EXISTS idx_reports_room 
ON reports(room);
```

## WebSocket Protocol

See [API.md](API.md) for detailed protocol specification.

## Security Model

### Client-side Security
- **Blocking**: Users can block others (stored in localStorage)
- **Input Validation**: Nickname and room name validation
- **XSS Protection**: React's built-in escaping + custom sanitization
- **Offline Queue**: Messages queued when offline

### Server-side Security
- **Rate Limiting**: 5 messages per 10 seconds per connection
- **Word Filtering**: Blacklist of forbidden words
- **Report System**: Users can report messages
- **Auto-Block**: 3 reports → 10 minute block
- **Input Validation**: All inputs validated before processing

### Data Security
- **No Authentication**: Public rooms (anyone can join)
- **No Persistent User Data**: Only messages stored in D1
- **Encryption**: All traffic via HTTPS/WSS
- **Data Retention**: Messages deleted after 7 days

## Performance Considerations

### Frontend Optimizations
- **Virtualization**: MessageList uses simple virtualization for >80 messages
- **Debouncing**: Typing indicator debounced to 300ms
- **Memoization**: useMemo, useCallback for expensive operations
- **Lazy Loading**: Images and icons lazy-loaded
- **Service Worker**: Caches app shell for offline use

### Backend Optimizations
- **In-Memory Cache**: Last 100 messages kept in memory
- **D1 Indexes**: Optimized queries with indexes
- **Batch Operations**: Cleanup runs on message insert
- **Connection Management**: Efficient WebSocket broadcasting

### Network Optimizations
- **Single Connection**: One WebSocket per room
- **Exponential Backoff**: Reconnect with increasing delays
- **Message Deduplication**: Client-side duplicate protection
- **Compression**: Built-in WebSocket compression

## Error Handling

### Client-side Errors
| Error | Handling |
|-------|----------|
| Connection lost | Auto-reconnect with backoff |
| Rate limited | Show toast notification |
| Invalid input | Show validation error |
| Blocked user | Show notification |
| Filtered message | Show notification |

### Server-side Errors
| Error | Response |
|-------|----------|
| Invalid message | `error: INVALID_INPUT` |
| Rate limit exceeded | `error: RATE_LIMIT` |
| Blocked user | `error: BLOCKED` |
| Filtered message | `error: FILTERED` |
| Nickname taken | `error: NICKNAME_TAKEN` |
| Internal error | `error: INTERNAL_ERROR` |

## Scalability

### Horizontal Scaling
- **Durable Objects**: Each room is a separate DO instance
- **Automatic Scaling**: Cloudflare scales DO instances as needed
- **No Shared State**: Each DO manages its own room

### Limits
| Resource | Limit | Notes |
|----------|-------|-------|
| Messages per room | 1000 | In D1, 100 in memory |
| Message retention | 7 days | Auto-cleanup |
| Rate limit | 5/10s | Per connection |
| Concurrent connections | Unlimited | Cloudflare scales |
| Message size | 1000 chars | Validated |
| Nickname length | 1-50 chars | Validated |

## Monitoring

### Cloudflare Dashboard
- **Workers**: Requests, errors, latency
- **Durable Objects**: Active instances, memory usage
- **D1**: Query performance, storage usage
- **Pages**: Build status, deployments

### Logging
- **Worker Logs**: `wrangler tail`
- **D1 Queries**: `wrangler d1 execute`
- **Client Logs**: Browser console
