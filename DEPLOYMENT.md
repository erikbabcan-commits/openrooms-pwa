# Deployment Guide

## Prerequisites

Before deploying OpenRooms PWA, ensure you have the following:

- [Node.js](https://nodejs.org/) ≥ 20.0.0
- [pnpm](https://pnpm.io/) ≥ 9.0.0
- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) ≥ 3.0.0
- Git

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/erikbabcan-commits/openrooms-pwa.git
cd openrooms-pwa
```

### 2. Install Dependencies

```bash
# Install all dependencies (pnpm workspaces)
pnpm install
```

---

## Cloudflare Setup

### Step 1: Authenticate with Cloudflare

```bash
# Login to Cloudflare
npx wrangler login

# Verify authentication
npx wrangler whoami
```

### Step 2: Create D1 Database

OpenRooms uses Cloudflare D1 for persistent message history.

```bash
# Create a new D1 database
npx wrangler d1 create openrooms-history
```

This will output something like:
```
✅ Successfully created database 'openrooms-history' with ID: abcdef01-2345-6789-abcd-ef0123456789
```

Copy the **database ID** for the next step.

### Step 3: Configure D1 Binding

Update `server/wrangler.toml` with your D1 database ID:

```toml
# server/wrangler.toml
name = "openrooms-ws"
main = "src/index.ts"
compatibility_date = "2026-01-01"

# D1 Database for persistent message history
[[d1_databases]]
binding = "DB"
database_name = "openrooms-history"
database_id = "abcdef01-2345-6789-abcd-ef0123456789"  # <-- YOUR D1 ID HERE

[[durable_objects.bindings]]
name = "ROOM"
class_name = "Room"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["Room"]
```

### Step 4: Create Cloudflare Pages Project

```bash
# Create a new Pages project
npx wrangler pages project create openrooms-pwa
```

Follow the prompts and select your Cloudflare account.

---

## Development Deployment

For local development and testing:

### Frontend (Local Server)

```bash
# Start Vite dev server
pnpm --filter app dev
```

This will start the frontend on `http://localhost:3000`.

### Backend (Local Worker)

```bash
cd server
pnpm dev
```

This will start the backend on `http://localhost:8787` with WebSocket support.

### Configure Frontend for Local Backend

Create `app/.env.local` file:

```env
# app/.env.local
VITE_WS_URL=ws://localhost:8787
```

Now you can test the full application locally:
- Open `http://localhost:3000` in your browser
- Join a room and start chatting
- Test WebSocket messages in the browser console

---

## Production Deployment

### Step 1: Build Frontend

```bash
# Build the frontend for production
pnpm --filter app build
```

This creates optimized production files in `app/dist/`.

### Step 2: Deploy to Cloudflare Pages

```bash
# Deploy frontend to Cloudflare Pages
npx wrangler pages deploy app/dist --project-name openrooms-pwa
```

Note: Replace `openrooms-pwa` with your actual Pages project name.

### Step 3: Deploy Backend to Cloudflare Workers

```bash
cd server
npx wrangler deploy
```

This deploys the Worker and Durable Objects to Cloudflare.

### Step 4: Configure Frontend for Production

Update `app/.env` or create `app/.env.production`:

```env
# app/.env.production
VITE_WS_URL=wss://your-worker.your-subdomain.workers.dev
```

Replace `your-worker.your-subdomain.workers.dev` with your actual Worker URL (output from `npx wrangler deploy`).

### Step 5: Rebuild and Redeploy Frontend

```bash
pnpm --filter app build
npx wrangler pages deploy app/dist --project-name openrooms-pwa
```

---

## Environment Variables

### Frontend (app/)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_WS_URL` | string | No | `window.location.origin` | WebSocket server URL |

**File**: `app/.env`, `app/.env.local`, or `app/.env.production`

### Backend (server/)

No environment variables required. All configuration is in `wrangler.toml`.

For local development, you can use `server/.dev.vars`:

```env
# server/.dev.vars
# No variables needed for basic functionality
# D1 binding is configured in wrangler.toml
```

---

## Configuration Files

### wrangler.toml (Backend)

```toml
name = "openrooms-ws"
main = "src/index.ts"
compatibility_date = "2026-01-01"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "openrooms-history"
database_id = "YOUR_D1_ID"

# Durable Objects
[[durable_objects.bindings]]
name = "ROOM"
class_name = "Room"

# Migrations
[[migrations]]
tag = "v1"
new_sqlite_classes = ["Room"]
```

### vite.config.ts (Frontend)

Configured with:
- React plugin
- PWA plugin (vite-plugin-pwa)
- TypeScript support
- Path aliases

---

## CI/CD Setup

### GitHub Actions Workflow

A complete CI/CD workflow is provided in `.github/workflows/test.yml`:

```yaml
name: Test and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

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

### Deploy on Push

To automatically deploy on push to main:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm --filter app build
      - run: npx wrangler pages deploy app/dist --project-name openrooms-pwa
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      - run: cd server && npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Required GitHub Secrets

| Secret | Description | How to Get |
|--------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | [Create token](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | [Account settings](https://dash.cloudflare.com/) |

---

## Monitoring and Debugging

### Cloudflare Dashboard

Access your Cloudflare dashboard for monitoring:

- **Workers**: https://dash.cloudflare.com/{account}/workers
  - View request counts, errors, and latency
  - Monitor Durable Object instances
  - View logs

- **D1**: https://dash.cloudflare.com/{account}/workers/d1
  - View database queries and performance
  - Execute queries directly
  - Monitor storage usage

- **Pages**: https://dash.cloudflare.com/{account}/pages
  - View build status and deployments
  - Monitor page views

### Command Line Tools

#### View Worker Logs

```bash
# Tail logs in real-time
npx wrangler tail

# Tail logs for a specific request
npx wrangler tail --filter "request.id = YOUR_REQUEST_ID"
```

#### Execute D1 Queries

```bash
# Connect to D1 database
npx wrangler d1 shell openrooms-history

# Or execute a single query
npx wrangler d1 execute openrooms-history --command "SELECT * FROM messages LIMIT 10"

# View table schema
npx wrangler d1 execute openrooms-history --command "SELECT sql FROM sqlite_master WHERE type='table'"
```

#### Test WebSocket Connection

```bash
# Using wscat (install with: npm install -g wscat)
wscat -c wss://your-worker.workers.dev/room/test

# Send a join message
> {"type": "join", "nickname": "testuser"}

# Send a message
> {"type": "message", "id": "test-1", "text": "Hello!"}

# Load history
> {"type": "history"}
```

---

## Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed

**Symptoms**: Connection errors in browser console

**Causes**:
- Backend not deployed
- Wrong WebSocket URL in frontend
- CORS issues

**Solutions**:
- Verify backend is deployed: `npx wrangler deploy`
- Check `VITE_WS_URL` in frontend configuration
- Cloudflare Workers handle CORS automatically

#### 2. D1 Database Not Found

**Symptoms**: Errors about missing database binding

**Causes**:
- D1 database not created
- Wrong database ID in wrangler.toml
- Database not in same account

**Solutions**:
- Verify D1 database exists: `npx wrangler d1 list`
- Check database ID in wrangler.toml
- Ensure database is in same Cloudflare account

#### 3. Messages Not Persisting

**Symptoms**: Messages disappear after Durable Object restart

**Causes**:
- D1 binding not configured
- Database connection error
- Messages not being stored

**Solutions**:
- Check D1 binding in wrangler.toml
- Verify messages in D1: `npx wrangler d1 execute openrooms-history --command "SELECT COUNT(*) FROM messages"`
- Check for errors in Worker logs: `npx wrangler tail`

#### 4. Rate Limiting Not Working

**Symptoms**: Users can send unlimited messages

**Causes**:
- Rate limit not configured
- Socket tracking issue

**Solutions**:
- Verify rate limit constants in Room.ts
- Check socket state in Durable Object
- Test with multiple rapid messages

#### 5. Offline Queue Not Working

**Symptoms**: Messages lost when offline

**Causes**:
- localStorage not available
- Queue not being flushed on reconnect

**Solutions**:
- Check browser support for localStorage
- Verify outboundQueue implementation
- Test offline/online cycle

---

## Performance Optimization

### Frontend

1. **Virtualization**: MessageList uses simple virtualization for >80 messages
2. **Debouncing**: Typing indicator debounced to 300ms
3. **Lazy Loading**: Images and icons are lazy-loaded
4. **Service Worker**: Caches app shell for offline use
5. **Code Splitting**: Vite automatically splits code

### Backend

1. **In-Memory Cache**: Last 100 messages kept in memory for fast access
2. **D1 Indexes**: Optimized queries with indexes on (room, ts)
3. **Batch Cleanup**: Old messages cleaned up on new message insert
4. **Efficient Broadcasting**: Single message sent to all clients

### Network

1. **Single Connection**: One WebSocket per room
2. **Compression**: Built-in WebSocket compression
3. **Exponential Backoff**: Smart reconnection strategy
4. **Message Deduplication**: Client-side duplicate protection

---

## Cost Considerations

### Cloudflare Pricing (Free Tier)

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Workers | 100,000 requests/day | More than enough for small projects |
| Durable Objects | 10,000 reads/day | Per DO instance |
| D1 | 5 GB storage, 100,000 reads/day | Shared across all databases |
| Pages | 100,000 requests/day | Static hosting |

### Estimated Costs

| Usage | Estimated Cost |
|-------|----------------|
| 100 users, 1000 messages/day | $0 (Free tier) |
| 1000 users, 10,000 messages/day | $0-$5/month |
| 10,000 users, 100,000 messages/day | $5-$20/month |

**Note**: Actual costs depend on your Cloudflare plan and usage patterns.

---

## Rollback

### Frontend Rollback

```bash
# Deploy a specific version
npx wrangler pages deploy app/dist --project-name openrooms-pwa --commit HASH

# Or use Pages dashboard to rollback
```

### Backend Rollback

```bash
# Deploy a specific version
cd server
git checkout PREVIOUS_COMMIT
npx wrangler deploy

# Or use Worker dashboard to rollback
```

---

## Maintenance

### Regular Tasks

1. **Monitor Usage**: Check Cloudflare dashboard for usage spikes
2. **Review Logs**: Use `npx wrangler tail` to check for errors
3. **Database Maintenance**: Monitor D1 storage usage
4. **Dependency Updates**: Regularly update dependencies

### Cleanup Old Data

Messages older than 7 days are automatically cleaned up. You can manually clean up:

```bash
# Delete messages older than 30 days
npx wrangler d1 execute openrooms-history --command "DELETE FROM messages WHERE ts < strftime('%s', 'now', '-30 days') * 1000"

# Delete all messages in a specific room
npx wrangler d1 execute openrooms-history --command "DELETE FROM messages WHERE room = 'room-name'"
```

---

## Support

For issues or questions:

1. **Check this documentation**
2. **Review Cloudflare Workers documentation**: https://developers.cloudflare.com/workers/
3. **Review Cloudflare D1 documentation**: https://developers.cloudflare.com/d1/
4. **Open an issue** in the repository

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
