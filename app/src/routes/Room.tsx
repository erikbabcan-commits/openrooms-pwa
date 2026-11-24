import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalStorageNickname } from '../hooks/useLocalStorageNickname';
import { useChatSocket } from '../hooks/useChatSocket';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { Message } from '../types';
import MessageList from '../components/MessageList';
import Composer from '../components/Composer';
import PresenceBar from '../components/PresenceBar';
import ConnectionStatus from '../components/ConnectionStatus';
import RoomSwitcher from '../components/RoomSwitcher';
import { sanitizeText } from '../lib/escape';
import Toast from '../components/Toast';
import '../styles/Room.css';

interface ToastMessage {
  id: string;
  text: string;
  type: 'error' | 'info' | 'success';
}

export default function Room() {
  const navigate = useNavigate();
  const { name: roomName } = useParams<{ name: string }>();
  const { nickname: storedNickname } = useLocalStorageNickname();
  const [nickname, setNickname] = useState<string>(storedNickname || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [presence, setPresence] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [newMessagesCount, setNewMessagesCount] = useState<number>(0);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const messageListRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const prevScrollHeightRef = useRef<number>(0);

  // Keep messages in sync with ref for scroll calculations
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const addToast = useCallback((text: string, type: 'error' | 'info' | 'success' = 'error') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, text, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const { sendMessage, sendTyping, connectionStatus, reconnect } = useChatSocket({
    roomName: roomName || '',
    nickname,
    onMessage: (msg) => {
      setMessages((prev) => {
        // Duplicate message protection
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
    onPresence: (nicknames) => {
      setPresence(nicknames);
    },
    onTyping: (nickname) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(nickname);
        return newSet;
      });
    },
    onHistory: (historyMessages, historyPresence) => {
      setMessages(historyMessages);
      setPresence(historyPresence);
    },
    onError: (code) => {
      console.error('WebSocket error:', code);
      if (code === 'RATE_LIMIT') {
        addToast('Too many messages! Please wait a moment.', 'error');
      } else if (code === 'INVALID_INPUT') {
        addToast('Invalid message. Please check your input.', 'error');
      } else if (code === 'NICKNAME_TAKEN') {
        addToast('Nickname is already taken. Please choose another.', 'error');
      } else {
        addToast(`Error: ${code}`, 'error');
      }
    },
  });

  // Initialize nickname
  useEffect(() => {
    if (!storedNickname) {
      navigate('/');
    } else {
      setNickname(storedNickname);
    }
  }, [storedNickname, navigate]);

  // Handle keyboard visibility
  useVisualViewport();

  const handleSendMessage = useCallback(async (text: string) => {
    if (!roomName || !nickname) return null;

    const sanitizedText = sanitizeText(text);
    if (!sanitizedText) return null;

    const messageId = await sendMessage(sanitizedText);
    return messageId;
  }, [roomName, nickname, sendMessage]);

  // Debounced typing indicator
  const typingTimeoutRef = useRef<number | null>(null);
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = window.setTimeout(() => {
      sendTyping();
    }, 300); // Debounce typing to reduce network traffic
  }, [sendTyping]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleScroll = useCallback((atBottom: boolean) => {
    setIsAtBottom(atBottom);
    if (atBottom) {
      setNewMessagesCount(0);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    setNewMessagesCount(0);
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  // Handle new messages without scroll jump
  useEffect(() => {
    const currentRef = messageListRef.current;
    if (!currentRef) return;

    const wasAtBottom = isAtBottom;
    const prevHeight = prevScrollHeightRef.current;
    const currentHeight = currentRef.scrollHeight;
    
    // Store current scroll position before DOM updates
    const scrollTopBefore = currentRef.scrollTop;
    const clientHeight = currentRef.clientHeight;

    // Check if we're still at bottom after messages render
    setTimeout(() => {
      if (wasAtBottom) {
        currentRef.scrollTo({
          top: currentRef.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        // Restore scroll position to prevent jump
        const scrollDiff = currentRef.scrollHeight - prevHeight;
        currentRef.scrollTop = scrollTopBefore + scrollDiff;
      }
    }, 0);

    prevScrollHeightRef.current = currentHeight;
  }, [messages, isAtBottom]);

  if (!roomName || !nickname) {
    return null;
  }

  return (
    <div className="room">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            text={toast.text}
            type={toast.type}
            onDismiss={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>

      <PresenceBar presence={presence} />
      
      <div className="room-content">
        <MessageList
          ref={messageListRef}
          messages={messages}
          nickname={nickname}
          onScroll={handleScroll}
          typingUsers={typingUsers}
        />
        
        {newMessagesCount > 0 && (
          <button className="new-messages-badge" onClick={scrollToBottom}>
            {newMessagesCount} new message{newMessagesCount > 1 ? 's' : ''} ↓
          </button>
        )}
      </div>

      <div className="room-footer">
        <ConnectionStatus status={connectionStatus} onReconnect={reconnect} />
        <Composer
          onSend={handleSendMessage}
          onTyping={handleTyping}
          disabled={connectionStatus !== 'ONLINE'}
          placeholder={connectionStatus === 'ONLINE' ? 'Type a message...' : 'Connecting...'}
        />
        <RoomSwitcher currentRoom={roomName} />
      </div>
    </div>
  );
}
