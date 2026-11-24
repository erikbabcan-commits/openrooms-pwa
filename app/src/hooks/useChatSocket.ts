import { useState, useCallback, useEffect, useRef } from 'react';
import { ClientMessage, ServerMessage, Message, ConnectionStatus } from '../types';
import { outboundQueue } from '../lib/outboundQueue';

interface UseChatSocketProps {
  roomName: string;
  nickname: string;
  onMessage?: (msg: Message) => void;
  onPresence?: (nicknames: string[]) => void;
  onTyping?: (nickname: string) => void;
  onHistory?: (messages: Message[], presence: string[], hasMore?: boolean, nextCursor?: string) => void;
  onError?: (code: string) => void;
}

interface UseChatSocketReturn {
  sendMessage: (text: string) => Promise<string | null>;
  sendTyping: () => void;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
  loadOlderHistory: (cursor?: string) => Promise<void>;
  hasMoreHistory: boolean;
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000]; // ms

export function useChatSocket({
  roomName,
  nickname,
  onMessage,
  onPresence,
  onTyping,
  onHistory,
  onError,
}: UseChatSocketProps): UseChatSocketReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('OFFLINE');
  const [hasMoreHistory, setHasMoreHistory] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  const isMountedRef = useRef<boolean>(true);
  const nextCursorRef = useRef<string | undefined>(undefined);

  const getWsUrl = useCallback(() => {
    // For Cloudflare Workers, use the worker URL
    // For local development, use the Vite dev server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/room/${encodeURIComponent(roomName)}`;
  }, [roomName]);

  const connect = useCallback(() => {
    if (!nickname || !roomName) return;

    try {
      const wsUrl = getWsUrl();
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnectionStatus('ONLINE');
        reconnectAttemptRef.current = 0;
        
        // Send join message with lastMessageId for initial history
        const joinMsg: ClientMessage = {
          type: 'join',
          nickname,
          lastMessageId: lastMessageIdRef.current,
        };
        socket.send(JSON.stringify(joinMsg));

        // Process queued messages
        processQueue();
      };

      socket.onmessage = (event) => {
        try {
          const data: ServerMessage = JSON.parse(event.data);
          
          switch (data.type) {
            case 'history':
              onHistory?.(data.messages || [], data.presence || [], data.hasMore, data.nextCursor);
              setHasMoreHistory(data.hasMore === true);
              if (data.nextCursor) {
                nextCursorRef.current = data.nextCursor;
              }
              // Update last message ID for reconnection
              if (data.messages && data.messages.length > 0) {
                lastMessageIdRef.current = data.messages[0].id;
              }
              break;
            case 'message':
              onMessage?.(data.msg);
              lastMessageIdRef.current = data.msg.id;
              break;
            case 'presence':
              onPresence?.(data.nicknames || []);
              break;
            case 'typing':
              onTyping?.(data.nickname || '');
              break;
            case 'error':
              onError?.(data.code || 'UNKNOWN_ERROR');
              break;
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      socket.onclose = () => {
        setConnectionStatus('OFFLINE');
        socketRef.current = null;
        scheduleReconnect();
      };

      socket.onerror = () => {
        // Error will trigger close, handled there
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
      scheduleReconnect();
    }
  }, [getWsUrl, nickname, roomName, onMessage, onPresence, onTyping, onHistory, onError]);

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;

    const delayIndex = Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1);
    const delay = RECONNECT_DELAYS[delayIndex];
    
    reconnectAttemptRef.current += 1;
    setConnectionStatus('RECONNECTING');

    reconnectTimeoutRef.current = window.setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const processQueue = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    let message = outboundQueue.dequeue();
    while (message) {
      try {
        const clientMsg: ClientMessage = {
          type: 'message',
          id: message.id,
          text: message.text,
        };
        socketRef.current?.send(JSON.stringify(clientMsg));
      } catch (e) {
        console.error('Failed to send queued message:', e);
      }
      message = outboundQueue.dequeue();
    }
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<string | null> => {
    const messageId = crypto.randomUUID();
    const message = { id: messageId, text, timestamp: Date.now(), roomName };

    // Queue the message
    outboundQueue.enqueue(message);

    // If socket is open, try to send immediately
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const clientMsg: ClientMessage = {
          type: 'message',
          id: messageId,
          text,
        };
        socketRef.current.send(JSON.stringify(clientMsg));
        outboundQueue.clear(); // Clear from queue since we sent it
        return messageId;
      } catch (e) {
        console.error('Failed to send message:', e);
        return null;
      }
    }

    return messageId;
  }, [roomName]);

  const sendTyping = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    try {
      const typingMsg: ClientMessage = { type: 'typing' };
      socketRef.current.send(JSON.stringify(typingMsg));
    } catch (e) {
      console.error('Failed to send typing indicator:', e);
    }
  }, []);

  const loadOlderHistory = useCallback(async (cursor?: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const historyMsg: ClientMessage = {
        type: 'history',
        cursor: cursor || nextCursorRef.current,
      };

      // Set up a one-time handler for the history response
      const originalOnMessage = socketRef.current.onmessage;
      socketRef.current.onmessage = (event) => {
        try {
          const data: ServerMessage = JSON.parse(event.data);
          if (data.type === 'history') {
            onHistory?.(data.messages || [], data.presence || [], data.hasMore, data.nextCursor);
            setHasMoreHistory(data.hasMore === true);
            if (data.nextCursor) {
              nextCursorRef.current = data.nextCursor;
            }
            socketRef.current!.onmessage = originalOnMessage;
            resolve();
          } else {
            // Handle other messages normally
            originalOnMessage?.(event);
          }
        } catch (e) {
          socketRef.current!.onmessage = originalOnMessage;
          reject(e);
        }
      };

      try {
        socketRef.current.send(JSON.stringify(historyMsg));
      } catch (e) {
        socketRef.current.onmessage = originalOnMessage;
        reject(e);
      }
    });
  }, [onHistory]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptRef.current = 0;
    connect();
  }, [connect]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (connectionStatus === 'OFFLINE') {
        reconnect();
      }
    };

    const handleOffline = () => {
      setConnectionStatus('OFFLINE');
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionStatus, reconnect]);

  // Connect on mount
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return {
    sendMessage,
    sendTyping,
    connectionStatus,
    reconnect,
    loadOlderHistory,
    hasMoreHistory,
  };
}
