# OpenRooms PWA

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Coverage](https://img.shields.io/badge/coverage-99.11%25%20statements%2F95.15%25%20branches-brightgreen.svg)](TESTING.md)
[![Tests](https://img.shields.io/badge/tests-70%20Vitest%20%2B%204%20Playwright-passing-brightgreen.svg)](TESTING.md)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20D1-orange.svg)](DEPLOYMENT.md)

**Simple global chat with public rooms** - Progressive Web App (PWA) built with React, Vite, TypeScript, and Cloudflare Workers + Durable Objects.

> **[32m[1m100dvh fullscreen mobile chat with zero operational costs on Cloudflare's free tier**[0m

---

## [36m[1m[4mFeatures[0m

### [32m[1mCore Functionality[0m
- [32m[1mReal-time chat[0m with WebSocket connections
- [32m[1mPublic rooms[0m - join any room with a nickname
- [32m[1mPresence tracking[0m - see who's online in the room
- [32m[1mMessage history[0m - 100 in memory, 1000 in D1 database
- [32m[1mTyping indicators[0m - see when others are typing
- [32m[1mRate limiting[0m - 5 messages per 10 seconds per user
- [32m[1mOffline support[0m - messages queue when offline
- [32m[1mExponential backoff reconnection[0m

### [36m[1mUser Experience[0m
- [36m[1m100dvh fullscreen[0m - optimized for mobile
- [36m[1mSafe-area insets[0m - support for notches and bezels
- [36m[1mVisualViewport handling[0m - keyboard resize on iOS
- [36m[1mOverscroll-behavior: none[0m - no address bar scroll
- [36m[1mGlassmorphism effects[0m - subtle backdrop-filter on message bubbles
- [36m[1mMessage grouping[0m - consecutive messages from same user grouped (5-min gap)
- [36m[1mAuto-scroll with badge[0m - smart scroll behavior

### [33m[1mModeration[0m
- [33m[1mClient-side blocking[0m - block users (stored in localStorage)
- [33m[1mServer-side reporting[0m - report messages
- [33m[1mAuto-block[0m - 3 reports = 10 minute block
- [33m[1mWord filtering[0m - server-side blacklist
- [33m[1mRate limit feedback[0m - toast notifications

### [35m[1mPWA Features[0m
- [35m[1mInstallable on mobile[0m (iOS Safari 16+, Android Chrome)
- [35m[1mService worker[0m - app shell caching
- [35m[1mStandalone display[0m - no browser chrome
- [35m[1mPortrait orientation[0m - mobile-optimized
- [35m[1mMaskable icons[0m - for PWA installation

### [31m[1mZero Cost[0m
- [31m[1mCloudflare free tier[0m - Workers, Durable Objects, D1, Pages
- [31m[1mNo external dependencies[0m - only Cloudflare services
- [31m[1mNo authentication needed[0m - public rooms

---

## [34m[1m[4mTech Stack[0m

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite 5 + TypeScript 5.3 | UI framework and tooling |
| **Styling** | CSS Modules + Global CSS | Component and global styles |
| **Routing** | React Router DOM 6.20 | Client-side navigation |
| **PWA** | vite-plugin-pwa 0.17 | Service worker and manifest |
| **Backend** | Cloudflare Workers | WebSocket routing |
| **Real-time** | Durable Objects | Stateful room instances |
| **Database** | Cloudflare D1 | Persistent message history |
| **Hosting** | Cloudflare Pages | Frontend hosting |
| **Package Manager** | pnpm workspaces | Monorepo management |

---

## [32m[1m[4mQuick Start[0m

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/erikbabcan-commits/openrooms-pwa.git
cd openrooms-pwa

# 2. Install dependencies (pnpm workspaces)
pnpm install

# 3. Start frontend dev server (Terminal 1)
pnpm --filter app dev

# 4. Start backend dev server (Terminal 2)
cd server
pnpm dev

# 5. Configure WebSocket URL
# Create app/.env.local with:
echo "VITE_WS_URL=ws://localhost:8787" > app/.env.local

# 6. Open in browser
# Navigate to http://localhost:3000
```

### Production Deployment

```bash
# 1. Build frontend
pnpm --filter app build

# 2. Deploy to Cloudflare Pages
npx wrangler pages deploy app/dist --project-name openrooms-pwa

# 3. Deploy backend to Cloudflare Workers
cd server
npx wrangler deploy

# 4. Update frontend WebSocket URL
# Set VITE_WS_URL in app/.env.production to your Worker URL
```

---

## [36m[1m[4mProject Structure[0m

```
openrooms-pwa/
├── app/                          # Frontend (React + Vite)
│   ├── public/                   # Static assets (icons, manifest)
│   └── src/
│       ├── components/           # React components
│       │   ├── MessageList.tsx    # Message container with virtualization
│       │   ├── MessageBubble.tsx  # Individual/grouped messages
│       │   ├── Composer.tsx       # Message input
│       │   ├── PresenceBar.tsx    # Online users
│       │   ├── ConnectionStatus.tsx # Connection state
│       │   ├── RoomSwitcher.tsx   # Room navigation
│       │   ├── TypingIndicator.tsx # Typing animation
│       │   ├── ContextMenu.tsx    # Block/Report menu
│       │   ├── BlockPanel.tsx     # Blocked users management
│       │   └── Toast.tsx          # Notifications
│       ├── hooks/                # Custom React hooks
│       │   ├── useChatSocket.ts   # WebSocket + history pagination
│       │   ├── useVisualViewport.ts # Keyboard handling
│       │   ├── useLocalStorageNickname.ts # Nickname persistence
│       │   └── useBlockedUsers.ts  # Client-side blocking
│       ├── lib/                  # Utility functions
│       │   ├── escape.ts          # XSS protection
│       │   ├── outboundQueue.ts   # Offline queue
│       │   └── groupMessages.ts   # Message grouping
│       ├── routes/               # Page routes
│       │   ├── JoinScreen.tsx     # Join form
│       │   └── Room.tsx           # Main chat room
│       ├── styles/               # CSS files
│       │   ├── global.css         # Global styles + variables
│       │   └── *.css              # Component styles
│       ├── types.ts              # TypeScript types
│       └── main.tsx              # App entry
│   ├── vite.config.ts            # Vite + PWA configuration
│   └── package.json
├── server/                       # Backend (Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts              # Worker entry (WebSocket routing)
│   │   └── Room.ts               # Durable Object (room logic, D1)
│   ├── wrangler.toml              # Cloudflare configuration
│   └── package.json
├── .github/                      # GitHub configuration
│   └── workflows/
│       └── test.yml              # CI workflow
├── Documentation                # Complete project documentation
│   ├── [34mARCHITECTURE.md[0m      # [36mSystem architecture, component tree, data flow[0m
│   ├── [34mAPI.md[0m               # [36mWebSocket protocol, message types, sequence diagrams[0m
│   ├── [34mDEPLOYMENT.md[0m       # [36mCloudflare setup, deployment, CI/CD, monitoring[0m
│   ├── [34mDEVELOPMENT.md[0m       # [36mLocal development, debugging, code style, testing[0m
│   ├── [34mCONTRIBUTING.md[0m      # [36mContribution guidelines, PR process, commit conventions[0m
│   └── [34mCHANGELOG.md[0m         # [36mVersion history, release notes, migration guide[0m
├── package.json                   # Workspace root (pnpm workspaces)
pnpm-workspace.yaml
├── .env.example
├── .gitignore
└── README.md                      # This file
```

---

## [34m[1m[4mDocumentation[0m

Complete, polished documentation is available:

| Document | Description | For |
|----------|-------------|-----|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System overview, component tree, state management, D1 schema, security model, performance considerations | Developers wanting to understand the system |
| **[API.md](API.md)** | WebSocket protocol, all message types, sequence diagrams, rate limiting, word filtering | Developers integrating with the backend |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Prerequisites, Cloudflare setup, development/production deployment, CI/CD, monitoring, troubleshooting | DevOps and deployment |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | Project structure, local setup, hot reload, debugging, code style, performance tips, browser support | Developers working on the codebase |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Code of Conduct, getting started, contribution guidelines, PR process, commit conventions, code review | Contributors |
| **[CHANGELOG.md](CHANGELOG.md)** | Version history, added/changed/fixed, release process, migration guides | Users tracking changes |
| **[TESTING.md](TESTING.md)** | Test structure, running tests, coverage, CI workflow | QA and testing |

---

## [32m[1m[4mArchitecture Overview[0m

```
[36mClient (PWA)[0m [37m--HTTPS--> [33mCloudflare Pages[0m [37m(Static Hosting)[0m
       |
       [37mWebSocket (WSS)[0m
       |
       v
[33mCloudflare Worker[0m [37m(Routing)[0m
       |
       [37mroom/{name}[0m
       |
       v
[35mDurable Object[0m [37m(One per room)[0m
       |
       +-- [34mIn-Memory Cache[0m (100 messages)
       +-- [36mWebSocket Connections[0m
       +-- [32mPresence Tracking[0m
       +-- [31mRate Limiting[0m (5/10s)
       |
       v
[31mD1 Database[0m [37m(Persistent History - 1000 messages)[0m
```

Each Durable Object represents one chat room and maintains:
- Active WebSocket connections
- Presence (nickname [37m[0m[33m->[0m socket mapping)
- Message history (100 in memory, 1000 in D1)
- Rate limiting per connection
- Word filtering
- Report tracking

---

## [34m[1m[4mWebSocket Protocol[0m

### Client [37m[0m[33m->[0m Server

```json
// Join a room
{"type": "join", "nickname": "john_doe", "lastMessageId": "..."}

// Send a message
{"type": "message", "id": "uuid", "text": "Hello!"}

// Typing indicator
{"type": "typing"}

// Report a message
{"type": "report", "messageId": "...", "reportedNickname": "...", "reason": "..."}

// Load older history
{"type": "history", "cursor": "..."}
```

### Server [37m[0m[33m->[0m Client

```json
// Initial history and presence
{"type": "history", "messages": [...], "presence": [...], "hasMore": true, "nextCursor": "..."}

// New message
{"type": "message", "msg": {"id": "...", "nickname": "...", "text": "...", "ts": 1234567890}}

// Presence update
{"type": "presence", "nicknames": ["john_doe", "jane_doe"]}

// Typing indicator
{"type": "typing", "nickname": "john_doe"}

// Error
{"type": "error", "code": "RATE_LIMIT"}

// Blocked notification
{"type": "blocked", "nickname": "spammer", "duration": 600000, "reason": "..."}
```

**Error Codes**: `RATE_LIMIT`, `INVALID_INPUT`, `BLOCKED`, `FILTERED`, `NICKNAME_TAKEN`, `INTERNAL_ERROR`

---

## [32m[1m[4mBrowser Support[0m

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 16+ | Required for 100dvh and visualViewport |
| Edge | 90+ | Full support |
| Chrome Android | 90+ | Full support |
| Safari iOS | 16+ | Required for PWA features |

---

## [34m[1m[4mTesting[0m

### Test Coverage

| Metric | Coverage | Status |
|--------|----------|--------|
| Statements | 99.11% | [32m[1mPassing[0m |
| Branches | 95.15% | [32m[1mPassing[0m |

### Test Suite

- **70 Vitest tests** - Unit and integration tests
- **4 Playwright scenarios** - E2E tests
- **All tests passing** - `pnpm test` and `pnpm test:e2e`

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Type checking
pnpm typecheck

# Build
pnpm build
```

See [TESTING.md](TESTING.md) for complete testing documentation.

---

## [34m[1m[4mCI/CD[0m

GitHub Actions workflow (`.github/workflows/test.yml`):

```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
      - run: pnpm typecheck
      - run: pnpm build
```

---

## [34m[1m[4mPerformance[0m

| Metric | Value | Notes |
|--------|-------|-------|
| Message delivery | < 300ms | Typical latency |
| Max messages/room | 1000 | In D1 database |
| Message retention | 7 days | Auto-cleanup |
| Rate limit | 5/10s | Per connection |
| Max message length | 1000 chars | Validated |
| Concurrent connections | Unlimited | Cloudflare scales |

---

## [34m[1m[4mCost Considerations[0m

### Cloudflare Free Tier

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Workers | 100,000 requests/day | More than enough for small projects |
| Durable Objects | 10,000 reads/day | Per DO instance |
| D1 | 5 GB storage, 100,000 reads/day | Shared across all databases |
| Pages | 100,000 requests/day | Static hosting |

### Estimated Costs

| Usage | Estimated Cost |
|-------|----------------|
| 100 users, 1,000 messages/day | **$0** (Free tier) |
| 1,000 users, 10,000 messages/day | $0-$5/month |
| 10,000 users, 100,000 messages/day | $5-$20/month |

---

## [34m[1m[4mRoadmap[0m

### [32m[1mCompleted (v1.0.0)[0m
- [x] Real-time chat with WebSocket
- [x] Public rooms with presence
- [x] Message history (1000/room)
- [x] Typing indicators
- [x] Rate limiting
- [x] Offline support
- [x] PWA features
- [x] Mobile optimization
- [x] Moderation (block, report, filter)
- [x] Complete documentation
- [x] Full test coverage (99.11%/95.15%)

### [36m[1mFuture Enhancements (v1.1.0+)[0m
- [ ] Emoji picker and reactions
- [ ] Dark mode
- [ ] Message editing/deleting
- [ ] User profiles
- [ ] Room discovery
- [ ] Search functionality
- [ ] Message search
- [ ] User authentication (optional)
- [ ] End-to-end encryption (optional)
- [ ] Voice messages (optional)

---

## [34m[1m[4mContributing[0m

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code of Conduct
- Getting started guide
- Contribution guidelines
- Pull request process
- Commit message conventions
- Code review process
- Reporting issues

---

## [34m[1m[4mSecurity[0m

### Reporting Security Vulnerabilities

**Do NOT report security vulnerabilities in public issues.**

If you discover a security vulnerability, please open a private security advisory on GitHub.

### Security Features

- Input validation on client and server
- XSS protection via React's built-in escaping
- Rate limiting (5 messages/10s per connection)
- Word filtering with blacklist
- Report system with auto-block
- All traffic via HTTPS/WSS

---

## [34m[1m[4mLicense[0m

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) for details.

---

## [34m[1m[4mAcknowledgments[0m

- **Cloudflare** - For providing the free tier infrastructure
- **React Team** - For the amazing framework
- **Vite Team** - For the fast development tooling
- **All Contributors** - For making this project better

---

## [34m[1m[4mSupport[0m

For issues or questions:

1. **Check the documentation** - [ARCHITECTURE.md](ARCHITECTURE.md), [API.md](API.md), [DEPLOYMENT.md](DEPLOYMENT.md), [DEVELOPMENT.md](DEVELOPMENT.md)
2. **Open an issue** on GitHub
3. **Review Cloudflare documentation**:
   - [Workers](https://developers.cloudflare.com/workers/)
   - [Durable Objects](https://developers.cloudflare.com/durable-objects/)
   - [D1](https://developers.cloudflare.com/d1/)
   - [Pages](https://developers.cloudflare.com/pages/)

---

<div align="center">
  
Made with [31m[1m[4m[0m[31m[1m[4m❤️[0m by the OpenRooms Team | 
  [34mPowered by Cloudflare[0m

</div>

---

*Last updated: November 25, 2024*
