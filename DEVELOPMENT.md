# Development Guide

## Overview

This guide covers everything you need to know for local development, debugging, and testing of OpenRooms PWA.

---

## Project Structure

```
openrooms-pwa/
├── app/                          # Frontend (React + Vite + TypeScript)
│   ├── public/                   # Static assets
│   │   ├── icons/                # PWA icons (192x192, 512x512, maskable)
│   │   ├── manifest.webmanifest  # PWA manifest
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── MessageList.tsx    # Message container with virtualization
│   │   │   ├── MessageBubble.tsx  # Individual/grouped messages with context menu
│   │   │   ├── Composer.tsx       # Message input with auto-resize
│   │   │   ├── PresenceBar.tsx    # Online users display
│   │   │   ├── ConnectionStatus.tsx # Connection state indicator
│   │   │   ├── RoomSwitcher.tsx   # Room navigation
│   │   │   ├── TypingIndicator.tsx # Typing animation
│   │   │   ├── ContextMenu.tsx    # Block/Report context menu
│   │   │   ├── BlockPanel.tsx     # Blocked users management
│   │   │   └── Toast.tsx          # Notification toasts
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useChatSocket.ts   # WebSocket communication + history pagination
│   │   │   ├── useVisualViewport.ts # Keyboard handling for mobile
│   │   │   ├── useLocalStorageNickname.ts # Nickname persistence
│   │   │   └── useBlockedUsers.ts  # Client-side blocking
│   │   ├── lib/                  # Utility functions
│   │   │   ├── escape.ts          # XSS protection (sanitization)
│   │   │   ├── outboundQueue.ts   # Offline message queue
│   │   │   └── groupMessages.ts   # Message grouping logic
│   │   ├── routes/               # Page routes
│   │   │   ├── JoinScreen.tsx     # Join form (nickname + room selection)
│   │   │   └── Room.tsx           # Main chat room
│   │   ├── styles/               # CSS files
│   │   │   ├── global.css         # Global styles, variables, animations
│   │   │   ├── MessageBubble.css  # Message styling (glassmorphism)
│   │   │   ├── MessageList.css    # List styling with virtualization
│   │   │   ├── Composer.css       # Input styling
│   │   │   ├── PresenceBar.css    # Presence display
│   │   │   ├── ConnectionStatus.css # Status indicators
│   │   │   ├── RoomSwitcher.css   # Room switcher
│   │   │   ├── TypingIndicator.css # Typing animation
│   │   │   ├── Room.css           # Room layout + loading indicators
│   │   │   ├── Toast.css          # Toast notifications
│   │   │   ├── ContextMenu.css    # Context menu styling
│   │   │   └── BlockPanel.css     # Block panel styling
│   │   ├── types.ts              # TypeScript interfaces and types
│   │   ├── vite-env.d.ts         # Vite environment type declarations
│   │   └── main.tsx              # App entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts            # Vite + PWA configuration
├── server/                       # Backend (Cloudflare Workers + Durable Objects)
│   ├── src/
│   │   ├── index.ts              # Worker entry point (WebSocket routing)
│   │   └── Room.ts               # Durable Object (room logic, D1 persistence)
│   ├── package.json
│   ├── tsconfig.json
│   └── wrangler.toml              # Cloudflare configuration
├── .env.example
├── .gitignore
├── package.json                   # Workspace root (pnpm workspaces)
pnpm-workspace.yaml
└── README.md                      # Project overview
```

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose | Installation |
|------|---------|---------|-------------|
| Node.js | >= 20.0.0 | JavaScript runtime | [Download Node.js](https://nodejs.org/) |
| pnpm | >= 9.0.0 | Package manager | `npm install -g pnpm` |
| Git | Latest | Version control | [Download Git](https://git-scm.com/) |

### Optional Tools

| Tool | Purpose | Installation |
|------|---------|-------------|
| Wrangler CLI | Cloudflare Workers development | `npm install -g wrangler` |
| wscat | WebSocket testing | `npm install -g wscat` |
| Playwright | E2E testing | `pnpm add -D @playwright/test` |

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/erikbabcan-commits/openrooms-pwa.git
cd openrooms-pwa
```

### 2. Install Dependencies

```bash
# Install all dependencies (pnpm workspaces handles both app and server)
pnpm install
```

This installs dependencies for both the frontend (`app/`) and backend (`server/`) packages.

---

## Running the Application

### Development Mode (Recommended)

#### Option A: Separate Terminals

**Terminal 1 - Frontend**:
```bash
# Start Vite dev server with hot reload
pnpm --filter app dev
```
- Runs on: `http://localhost:3000`
- Hot module replacement enabled
- Auto-opens in browser

**Terminal 2 - Backend**:
```bash
cd server
pnpm dev
```
- Runs on: `http://localhost:8787`
- WebSocket endpoint: `ws://localhost:8787/room/{roomName}`

#### Option B: Single Command

```bash
# Start both frontend and backend (requires concurrent execution)
pnpm dev
```

Note: The default `pnpm dev` only starts the frontend. For full stack, use separate terminals.

### Configure WebSocket URL

Create `app/.env.local` for development:

```env
# app/.env.local
VITE_WS_URL=ws://localhost:8787
```

This tells the frontend to connect to your local backend.

### Production Build

```bash
# Build frontend for production
pnpm --filter app build
```

Output: `app/dist/` (static files ready for deployment)

---

## Development Workflow

### Hot Reload

- **Frontend**: Vite provides instant hot reload. Changes to `.tsx`, `.ts`, `.css` files are reflected immediately.
- **Backend**: Wrangler provides hot reload for Worker code. Changes to `server/src/` are automatically deployed to the local dev server.

### Code Quality

#### Type Checking

```bash
# Check TypeScript types for all packages
pnpm typecheck
```

#### Linting

```bash
# Run ESLint (if configured)
pnpm lint
```

### Testing

See [TESTING.md](TESTING.md) for complete testing documentation.

---

## Debugging

### Frontend Debugging

#### Browser DevTools

- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
- **Firefox**: Press `F12` or `Ctrl+Shift+I`
- **Safari**: Enable Developer Menu in Preferences, then `Cmd+Opt+I`

**Key areas to check**:
- **Console**: WebSocket connection errors, TypeScript errors
- **Network**: WebSocket frames, HTTP requests
- **Elements**: DOM structure, CSS styles
- **Application**: localStorage, service worker

#### React DevTools

Install the [React Developer Tools](https://react.dev/learn/react-developer-tools) extension for your browser to:
- Inspect component tree
- View component props and state
- Track component renders
- Debug hooks

#### Debugging WebSocket

In browser console:
```javascript
// Access the WebSocket connection
const socket = document.querySelector('...') // Find your WebSocket reference

// Listen to events
socket.addEventListener('open', () => console.log('Connected'))
socket.addEventListener('close', () => console.log('Disconnected'))
socket.addEventListener('error', (e) => console.error('Error:', e))
socket.addEventListener('message', (e) => console.log('Message:', e.data))
```

### Backend Debugging

#### Wrangler Tail

View real-time logs from your Worker:

```bash
# In server directory
cd server
pnpm tail
```

Or with filters:
```bash
# Filter by request ID
pnpm tail --filter "request.id = YOUR_REQUEST_ID"

# Filter by room name
pnpm tail --filter "room = test-room"
```

#### Console Logging

Add `console.log()` statements in `server/src/index.ts` or `server/src/Room.ts`:

```typescript
// In Room.ts
console.log(`[Room ${this.roomName}] User joined: ${nickname}`);
console.log(`[Room ${this.roomName}] Message received: ${text}`);
```

These logs will appear in `wrangler tail` output.

#### Testing WebSocket with wscat

```bash
# Install wscat
npm install -g wscat

# Connect to local backend
wscat -c ws://localhost:8787/room/test

# Send messages
> {"type": "join", "nickname": "testuser"}
> {"type": "message", "id": "test-1", "text": "Hello!"}
> {"type": "history"}
```

### Mobile Debugging

#### iOS Safari

1. Enable Web Inspector on iOS:
   - Settings > Safari > Advanced > Web Inspector = ON
2. Connect iPhone to Mac via USB
3. Open Safari on Mac
4. Develop > [Your iPhone] > [Your PWA]

#### Android Chrome

1. Enable USB Debugging on Android:
   - Settings > Developer Options > USB Debugging = ON
2. Connect Android to computer via USB
3. Open Chrome on computer
4. chrome://inspect/#devices
5. Click "inspect" on your PWA

#### VisualViewport Debugging

The `useVisualViewport` hook handles keyboard resizing. Debug with:

```javascript
// In browser console
console.log('visualViewport:', window.visualViewport);
console.log('innerHeight:', window.innerHeight);
console.log('visualViewport height:', window.visualViewport?.height);
```

---

## Configuration

### Frontend Configuration

#### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'OpenRooms PWA',
        short_name: 'OpenRooms',
        description: 'Simple global chat with public rooms',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [...],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
```

#### Environment Variables

Create `app/.env.local` for development:

```env
# WebSocket server URL
VITE_WS_URL=ws://localhost:8787

# App version (optional)
VITE_APP_VERSION=1.0.0
```

### Backend Configuration

#### wrangler.toml

```toml
name = "openrooms-ws"
main = "src/index.ts"
compatibility_date = "2026-01-01"

# D1 Database for persistent message history
[[d1_databases]]
binding = "DB"
database_name = "openrooms-history"
database_id = "YOUR_D1_ID"

# Durable Objects for room instances
[[durable_objects.bindings]]
name = "ROOM"
class_name = "Room"

# Migrations
[[migrations]]
tag = "v1"
new_sqlite_classes = ["Room"]
```

#### .dev.vars (Local Development)

Create `server/.dev.vars` for local environment variables:

```env
# No variables needed for basic functionality
# D1 binding is configured in wrangler.toml
```

---

## Code Style Guidelines

### TypeScript

- **Strict Mode**: Always enabled
- **No Implicit Any**: Explicit types for all variables and functions
- **Type Inference**: Use when clear, but prefer explicit types for public APIs
- **Interfaces vs Types**: Use `interface` for object shapes, `type` for unions/complex types

**Example**:
```typescript
// Good
interface Message {
  id: string;
  nickname: string;
  text: string;
  ts: number;
}

// Bad
const message: any = { ... };
```

### React

- **Functional Components**: Always use functional components with hooks
- **TypeScript Props**: Always type component props
- **Hooks**: Use custom hooks for reusable logic
- **Memoization**: Use `useMemo` and `useCallback` for expensive operations
- **Keys**: Always use proper keys for lists

**Example**:
```typescript
// Good
interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onContextMenu: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  // ...
};

// Bad
const MessageBubble = ({ message }) => { ... }; // No types
```

### CSS

- **CSS Modules**: Use for component-specific styles
- **Global CSS**: Use for shared styles, variables, and base reset
- **CSS Custom Properties**: Use for theming and dynamic values
- **Animations**: Use CSS keyframes for micro-animations (0.15-0.25s)
- **Mobile First**: Always consider mobile constraints

**Example**:
```css
/* Good - in global.css */
:root {
  --color-primary: #e94560;
  --color-secondary: #6c757d;
  --color-background: #f8f9fa;
  --animation-duration: 0.2s;
}

/* Good - in MessageBubble.css */
.message {
  animation: fadeIn var(--animation-duration) ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### WebSocket Protocol

- **JSON Format**: All messages are JSON strings
- **Type Discrimination**: Always include `type` field
- **Error Handling**: Always handle error responses
- **Validation**: Validate all inputs on both client and server

**Example**:
```typescript
// Good - type-safe message handling
type ClientMessage = 
  | { type: 'join'; nickname: string; lastMessageId?: string }
  | { type: 'message'; id: string; text: string }
  | { type: 'typing' };

type ServerMessage = 
  | { type: 'history'; messages: Message[]; presence: string[] }
  | { type: 'message'; msg: Message }
  | { type: 'error'; code: string };
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `messageText`, `userNickname` |
| Constants | UPPER_SNAKE_CASE | `MAX_MESSAGES`, `RATE_LIMIT` |
| Functions | camelCase | `sendMessage`, `handleJoin` |
| Components | PascalCase | `MessageBubble`, `PresenceBar` |
| Files | kebab-case | `message-bubble.tsx`, `use-chat-socket.ts` |
| Types | PascalCase | `Message`, `SocketInfo` |
| Interfaces | PascalCase | `MessageProps`, `UseChatSocketReturn` |

---

## Performance Tips

### Frontend Performance

1. **Virtualization**: Use simple virtualization for long lists (>80 messages)
2. **Debouncing**: Debounce typing indicators (300ms)
3. **Memoization**: Memoize expensive computations
4. **Lazy Loading**: Lazy load non-critical components
5. **Image Optimization**: Compress and optimize all images

**Example - Virtualization**:
```typescript
// In MessageList.tsx
const visibleMessages = messages.slice(
  Math.max(0, messages.length - 80),
  messages.length
);
```

**Example - Debouncing**:
```typescript
// In Composer.tsx
const debouncedTyping = useDebounce(() => {
  sendTyping();
}, 300);

useEffect(() => {
  if (text.length > 0) {
    debouncedTyping();
  }
}, [text]);
```

### Backend Performance

1. **In-Memory Cache**: Keep last 100 messages in memory for fast access
2. **D1 Indexes**: Create indexes for frequent queries
3. **Batch Operations**: Clean up old messages on new message insert
4. **Efficient Broadcasting**: Send single message to all clients

**Example - D1 Index**:
```sql
-- In Room.ts initialization
CREATE INDEX IF NOT EXISTS idx_messages_room_ts 
ON messages(room, ts DESC);
```

### Network Performance

1. **Single Connection**: Use one WebSocket per room
2. **Compression**: Enable WebSocket compression
3. **Exponential Backoff**: Smart reconnection strategy
4. **Message Deduplication**: Client-side duplicate protection

---

## Browser Support

### Supported Browsers

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 16+ | Required for 100dvh support |
| Edge | 90+ | Full support |
| Chrome Android | 90+ | Full support |
| Safari iOS | 16+ | Required for 100dvh and visualViewport |

### Mobile-Specific Features

| Feature | iOS Safari | Android Chrome | Notes |
|---------|------------|----------------|-------|
| 100dvh | 16+ | 90+ | Dynamic viewport height |
| visualViewport | 16+ | 90+ | Keyboard resize handling |
| safe-area-inset | 16+ | 90+ | Notch/bezel insets |
| overscroll-behavior | 16+ | 90+ | Disable address bar scroll |

### Fallbacks

```css
/* Fallback for 100dvh */
html, body, #root {
  height: 100dvh;
  height: 100svh; /* Fallback for older browsers */
  min-height: 100vh; /* Fallback for very old browsers */
}
```

---

## Troubleshooting

### Common Development Issues

#### 1. WebSocket Connection Failed

**Symptoms**: `WebSocket connection to 'ws://localhost:8787/room/test' failed`

**Causes**:
- Backend not running
- Wrong port number
- CORS issues

**Solutions**:
- Start backend: `cd server && pnpm dev`
- Verify port: Check `wrangler dev` output
- Check CORS: Cloudflare Workers handle CORS automatically

#### 2. Hot Reload Not Working

**Symptoms**: Changes not reflected in browser

**Causes**:
- Not using Vite dev server
- Browser cache

**Solutions**:
- Use `pnpm --filter app dev`
- Disable browser cache in dev tools
- Try hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`

#### 3. TypeScript Errors

**Symptoms**: Type errors in editor or build

**Causes**:
- Missing type definitions
- Type mismatches

**Solutions**:
- Run `pnpm typecheck`
- Check error messages for specific issues
- Add proper type annotations

#### 4. CSS Not Applying

**Symptoms**: Styles not visible

**Causes**:
- Wrong CSS module import
- Specificity issues
- Browser cache

**Solutions**:
- Check import path: `import styles from './Component.module.css'`
- Use browser dev tools to inspect styles
- Disable browser cache

#### 5. WebSocket Messages Not Received

**Symptoms**: Messages not appearing in UI

**Causes**:
- WebSocket not connected
- Message handler not registered
- Type mismatch

**Solutions**:
- Check WebSocket connection state in browser console
- Verify message handler in `useChatSocket.ts`
- Check `wrangler tail` for backend logs

#### 6. D1 Database Errors

**Symptoms**: Messages not persisting, D1 errors

**Causes**:
- D1 not configured
- Wrong database ID
- Schema mismatch

**Solutions**:
- Verify D1 configuration in `wrangler.toml`
- Check database exists: `npx wrangler d1 list`
- Verify schema: `npx wrangler d1 execute DB --command "SELECT sql FROM sqlite_master"`

---

## Useful Commands

### Frontend Commands

```bash
# Start dev server
pnpm --filter app dev

# Build for production
pnpm --filter app build

# Preview production build
pnpm --filter app preview

# Type checking
pnpm --filter app typecheck
```

### Backend Commands

```bash
# Start dev server
cd server && pnpm dev

# Deploy to Cloudflare
cd server && pnpm deploy

# View logs
cd server && pnpm tail

# Execute D1 query
npx wrangler d1 execute DB --command "SELECT * FROM messages LIMIT 10"

# Shell access to D1
npx wrangler d1 shell DB
```

### Workspace Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Type checking for all packages
pnpm typecheck
```

---

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Durable Objects Documentation](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [CSS Viewport Units](https://developer.mozilla.org/en-US/docs/Web/CSS/Viewport_concepts)
- [PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
