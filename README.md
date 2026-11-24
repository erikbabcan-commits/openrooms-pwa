# OpenRooms PWA

Simple global chat with public rooms - Progressive Web App (PWA) built with React, Vite, TypeScript, and Cloudflare Workers + Durable Objects.

## Features

- **Real-time chat** with WebSocket connections
- **Public rooms** - join any room with a name
- **Presence tracking** - see who's online in the room
- **Message history** - last 100 messages per room
- **Typing indicators** - see when others are typing
- **Rate limiting** - 5 messages per 10 seconds per user
- **Offline support** - messages queue when offline
- **PWA** - installable on mobile devices
- **100dvh fullscreen** - optimized for mobile experience

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Cloudflare Workers + Durable Objects
- **Real-time**: WebSocket
- **PWA**: vite-plugin-pwa
- **Hosting**: Cloudflare Pages + Workers

## Project Structure

```
openrooms/
├── app/                          # React PWA (Vite)
│   ├── src/
│   │   ├── routes/               # JoinScreen, Room
│   │   ├── components/           # MessageList, Composer, etc.
│   │   ├── hooks/                # useChatSocket, useVisualViewport
│   │   ├── lib/                  # outboundQueue, escape
│   │   └── styles/              # Global CSS
│   └── vite.config.ts
└── server/                       # Cloudflare Workers
    ├── src/
    │   ├── index.ts              # Worker routing
    │   └── Room.ts               # Durable Object
    └── wrangler.toml
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Cloudflare account (for deployment)

### Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start frontend dev server:
   ```bash
   pnpm --filter app dev
   ```

3. Start backend (requires Wrangler):
   ```bash
   cd server
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Production Deployment

1. Build frontend:
   ```bash
   pnpm --filter app build
   ```

2. Deploy to Cloudflare Pages:
   ```bash
   npx wrangler pages deploy app/dist
   ```

3. Deploy backend to Cloudflare Workers:
   ```bash
   cd server
   npx wrangler deploy
   ```

## Configuration

### Environment Variables

- `VITE_WS_URL` - WebSocket server URL (optional, defaults to same origin)

### Wrangler Configuration

Update `server/wrangler.toml` with your Cloudflare account details.

## Architecture

```
PWA Client → Cloudflare Pages (static) → Worker (routing) → Durable Object (room)
```

Each Durable Object represents one chat room and maintains:
- Active WebSocket connections
- Presence (nickname → socket mapping)
- Message history (last 100 messages)
- Rate limiting per connection

## WebSocket Protocol

### Client → Server
```json
{ "type": "join", "nickname": "string", "lastMessageId"?: "string" }
{ "type": "message", "id": "string", "text": "string" }
{ "type": "typing" }
```

### Server → Client
```json
{ "type": "history", "messages": [Message], "presence": [string] }
{ "type": "message", "msg": Message }
{ "type": "presence", "nicknames": [string] }
{ "type": "typing", "nickname": "string" }
{ "type": "error", "code": "string" }
```

## License

MIT
