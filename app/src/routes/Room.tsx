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
import '../styles/Room.css';

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
  const messageListRef = useRef<HTMLDivElement>(null);

  const { sendMessage, sendTyping, connectionStatus, reconnect } = useChatSocket({
    roomName: roomName || '',
    nickname,
    onMessage: (msg) => {
      setMessages((prev) => {
        // Avoid duplicates
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
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(nickname);
          return newSet;
        });
      }, 3000);
    },
    onHistory: (historyMessages, historyPresence) => {
      setMessages(historyMessages);
      setPresence(historyPresence);
    },
    onError: (code) => {
      console.error('WebSocket error:', code);
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

  const handleTyping = useCallback(() => {
    sendTyping();
  }, [sendTyping]);

  const handleScroll = useCallback((isAtBottom: boolean) => {
    setIsAtBottom(isAtBottom);
    if (isAtBottom) {
      setNewMessagesCount(0);
    }
  }, []);

  const handleNewMessage = useCallback(() => {
    if (!isAtBottom) {
      setNewMessagesCount((prev) => prev + 1);
    }
  }, [isAtBottom]);

  // Update new messages count when messages change
  useEffect(() => {
    if (messages.length > 0 && !isAtBottom) {
      handleNewMessage();
    }
  }, [messages.length, isAtBottom, handleNewMessage]);

  const scrollToBottom = useCallback(() => {
    setNewMessagesCount(0);
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  // Scroll to bottom when at bottom and new message arrives
  useEffect(() => {
    if (isAtBottom && messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isAtBottom]);

  if (!roomName || !nickname) {
    return null;
  }

  return (
    <div className="room">
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
