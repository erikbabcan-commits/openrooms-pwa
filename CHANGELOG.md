# Changelog

All notable changes to OpenRooms PWA are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2024-11-25

### Initial Release - Complete MVP

The first production-ready release of OpenRooms PWA with all core features implemented and thoroughly tested.

---

### Added

#### Core Features
- **Real-time chat** with WebSocket communication
- **Public rooms** - anyone can join any room with a nickname
- **Presence tracking** - see who's currently online in the room
- **Message history** - last 100 messages in memory, 1000 in D1 database
- **Typing indicators** - see when others are typing
- **Rate limiting** - 5 messages per 10 seconds per connection
- **Offline support** - messages queue when offline and flush on reconnect
- **PWA capabilities** - installable on mobile devices with service worker

#### User Interface
- **JoinScreen** - nickname and room selection
- **Room** - main chat interface
- **MessageList** - message container with virtualization for >80 messages
- **MessageBubble** - individual messages with grouping (5-minute gap)
- **Composer** - message input with auto-resize
- **PresenceBar** - display of online users with truncation and tooltips
- **ConnectionStatus** - connection state indicator
- **RoomSwitcher** - room navigation
- **TypingIndicator** - typing animation
- **ContextMenu** - long-tap/right-click menu for block/report
- **BlockPanel** - blocked users management
- **Toast** - notification toasts for errors and status messages

#### Backend
- **Cloudflare Worker** - WebSocket routing to Durable Objects
- **Durable Object (Room)** - one per room, manages:
  - Active WebSocket connections
  - Presence (nickname to socket mapping)
  - Message history (100 in memory, 1000 in D1)
  - Rate limiting per connection
  - Word filtering with blacklist
  - Report system with auto-block after 3 reports

#### Persistence
- **D1 Database** - persistent message history
  - Messages table with room, nickname, text, timestamp
  - Indexes for efficient pagination
  - Automatic cleanup of messages older than 7 days
  - Limit of 1000 messages per room
- **localStorage** - client-side persistence for:
  - Nickname
  - Blocked users (per room)
  - Offline message queue

#### WebSocket Protocol
- **Client to Server**: join, message, typing, report, history
- **Server to Client**: history, message, presence, typing, blocked, error
- **Error codes**: RATE_LIMIT, INVALID_INPUT, BLOCKED, FILTERED, NICKNAME_TAKEN, INTERNAL_ERROR

#### Mobile Optimization
- **100dvh fullscreen** - dynamic viewport height
- **100svh fallback** - for older browsers
- **visualViewport handling** - keyboard resize on iOS
- **safe-area insets** - support for notches and bezels
- **overscroll-behavior: none** - disable address bar scroll
- **Glassmorphism** - subtle backdrop-filter effects on message bubbles

#### PWA Features
- **vite-plugin-pwa** - automatic manifest and service worker
- **App shell caching** - offline support
- **Standalone display** - no browser chrome
- **Portrait orientation** - mobile-optimized
- **Maskable icons** - for PWA installation
- **Theme colors** - consistent branding

#### Moderation
- **Client-side blocking** - users can block others (stored in localStorage)
- **Server-side reporting** - users can report messages
- **Auto-block** - 3 reports on same user = 10 minute block
- **Word filtering** - server-side blacklist of forbidden words
- **Rate limit feedback** - toast notification when rate limited

#### Accessibility
- **Keyboard navigation** - all interactive elements accessible via keyboard
- **Focus states** - visible focus indicators
- **Semantic HTML** - proper use of HTML elements
- **Tooltips** - for truncated text

---

### Technical Implementation

#### Frontend (React + Vite + TypeScript)
- **React 18.2.0** - functional components, hooks
- **Vite 5.0.0** - fast dev server and builds
- **TypeScript 5.3.0** - strict mode, proper typing
- **React Router DOM 6.20.0** - client-side routing
- **vite-plugin-pwa 0.17.0** - PWA support

#### Backend (Cloudflare Workers + Durable Objects)
- **Cloudflare Workers** - WebSocket routing
- **Durable Objects** - stateful room instances
- **D1 Database** - persistent message history
- **WebSocket API** - real-time communication

#### Testing
- **Vitest** - unit and integration tests
- **React Testing Library** - component testing
- **Playwright** - E2E testing
- **Coverage** - 99.11% statements / 95.15% branches

#### Architecture
- **Monorepo** - pnpm workspaces
- **Modular** - separate app and server packages
- **Scalable** - one DO per room, automatic scaling

---

## [0.1.0] - 2024-11-20

### Pre-Alpha - Core MVP

Initial implementation of the core chat functionality.

### Added
- Basic WebSocket communication
- Simple message sending and receiving
- Room joining with nickname
- Presence tracking
- Message history (in-memory only)
- Basic UI components

---

## [Unreleased]

### Added
- Complete documentation (ARCHITECTURE.md, API.md, DEPLOYMENT.md, DEVELOPMENT.md, CONTRIBUTING.md, CHANGELOG.md)

### Changed
- Updated README.md with comprehensive documentation links

---

## Versioning Policy

OpenRooms PWA uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR** version for backward-incompatible changes
- **MINOR** version for backward-compatible new features
- **PATCH** version for backward-compatible bug fixes

---

## Release Process

1. **Update CHANGELOG.md** - Document all changes since last release
2. **Update version** - Bump version in package.json files
3. **Run tests** - Ensure all tests pass (`pnpm test`, `pnpm test:e2e`)
4. **Build** - Create production build (`pnpm build`)
5. **Deploy** - Deploy to Cloudflare Pages and Workers
6. **Create GitHub Release** - Tag and release on GitHub

---

## Migration Guide

### From Pre-Alpha (0.1.0) to 1.0.0

No migration needed. The 1.0.0 release is the first production-ready version.

---

## Deprecations

None at this time.

---

## Known Issues

None known at this time. All reported issues have been fixed.

---

## Support Policy

| Version | Supported | Notes |
|---------|-----------|-------|
| 1.0.0 | Yes | Latest stable release |
| < 1.0.0 | No | Pre-release versions |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

*Changelog generated and maintained manually. Last updated: November 25, 2024.*
