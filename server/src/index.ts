// Cloudflare Worker entry point
// Routes WebSocket connections to Durable Objects

import { Room } from './Room';

export interface Env {
  ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle WebSocket upgrade
    if (path.startsWith('/room/')) {
      const roomName = path.slice(6); // Remove '/room/' prefix
      if (!roomName) {
        return new Response('Room name required', { status: 400 });
      }

      // Validate room name (alphanumeric, underscores, hyphens, 1-50 chars)
      if (!/^[a-zA-Z0-9_-]{1,50}$/.test(roomName)) {
        return new Response('Invalid room name', { status: 400 });
      }

      // Get or create Durable Object for this room
      const roomId = env.ROOM.idFromName(roomName);
      const roomStub = env.ROOM.get(roomId);

      // Forward WebSocket request to Durable Object
      return roomStub.fetch(request);
    }

    // Handle HTTP requests (for health checks, etc.)
    if (path === '/') {
      return new Response('OpenRooms WebSocket Server', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },
};
