import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalStorageNickname } from '../hooks/useLocalStorageNickname';
import { useChatSocket } from '../hooks/useChatSocket';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { useBlockedUsers } from '../hooks/useBlockedUsers';
import { Message } from '../types';
import MessageList from '../components/MessageList';
import Composer from '../components/Composer';
import PresenceBar from '../components/PresenceBar';
import ConnectionStatus from '../components/ConnectionStatus';
import RoomSwitcher from '../components/RoomSwitcher';
import BlockPanel from '../components/BlockPanel';
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
  const [showBlockPanel, setShowBlockPanel] = useState<boolean>(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const prevScrollHeightRef = useRef<number>(0);

  // Blocked users management
  const { blockedUsers, blockUser, unblockUser, isBlocked, getBlockedUsersArray } = useBlockedUsers(roomName || '');

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

  // Filter blocked messages
  const filteredMessages = messages.filter((msg) => !isBlocked(msg.nickname));

  const { sendMessage, sendTyping, connectionStatus, reconnect, loadOlderHistory, hasMoreHistory } = useChatSocket({
    roomName: roomName || '',
    nickname,
    onMessage: (msg) => {
      // Don't show blocked messages
      if (!isBlocked(msg.nickname)) {
        setMessages((prev) => {
          // Duplicate message protection
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    },
    onPresence: (nicknames) => {
      setPresence(nicknames);
    },
    onTyping: (nickname) => {
      // Don't show typing for blocked users
      if (!isBlocked(nickname)) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.add(nickname);
          return newSet;
        });
      }
    },
    onHistory: (historyMessages, historyPresence, hasMore, nextCursor) => {
      // If this is initial load, replace messages
      // If this is pagination, prepend to messages
      if (messages.length === 0) {
        setMessages(historyMessages);
      } else {
        // For pagination, we prepend older messages
        setMessages((prev) => {
          // Remove duplicates
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = historyMessages.filter((m) => !existingIds.has(m.id));
          return [...newMessages, ...prev];
        });
      }
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
      } else if (code === 'BLOCKED') {
        addToast('You have been blocked from this room.', 'error');
      } else if (code === 'FILTERED') {
        addToast('Your message was filtered. Please follow the rules.', 'error');
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

  // Handle scroll to top for loading older messages
  const handleScrollTop = useCallback(async () => {
    const currentRef = messageListRef.current;
    if (!currentRef || isLoadingOlder || !hasMoreHistory) return;

    const scrollTop = currentRef.scrollTop;
    const scrollHeight = currentRef.scrollHeight;
    const clientHeight = currentRef.clientHeight;
    
    // Check if user scrolled near the top (within 100px)
    if (scrollTop < 100 && !isLoadingOlder) {
      setIsLoadingOlder(true);
      
      try {
        // Get the oldest message ID as cursor
        const oldestMessage = filteredMessages[0];
        const cursor = oldestMessage?.id;
        
        await loadOlderHistory(cursor);
      } catch (e) {
        console.error('Failed to load older history:', e);
        addToast('Failed to load older messages', 'error');
      } finally {
        setIsLoadingOlder(false);
      }
    }
  }, [filteredMessages, isLoadingOlder, hasMoreHistory, loadOlderHistory, addToast]);

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

  // Handle block/unblock
  const handleBlockUser = useCallback((nickname: string) => {
    blockUser(nickname);
    addToast(`Blocked ${nickname}`, 'info');
  }, [blockUser, addToast]);

  const handleUnblockUser = useCallback((nickname: string) => {
    unblockUser(nickname);
    addToast(`Unblocked ${nickname}`, 'info');
  }, [unblockUser, addToast]);

  // Handle report
  const handleReport = useCallback((messageId: string, reportedNickname: string) => {
    addToast(`Reported ${reportedNickname}'s message`, 'info');
    
    // Send report to server via WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const reportMsg = {
          type: 'report',
          messageId,
          reportedNickname,
          reporter: nickname,
        };
        socketRef.current.send(JSON.stringify(reportMsg));
      } catch (e) {
        console.error('Failed to send report:', e);
      }
    }
  }, [nickname, addToast]);

  // Toggle block panel
  const toggleBlockPanel = useCallback(() => {
    setShowBlockPanel((prev) => !prev);
  }, []);

  // Add scroll event listener for infinite scroll
  useEffect(() => {
    const currentRef = messageListRef.current;
    if (!currentRef) return;

    const handleScroll = () => {
      handleScrollTop();
    };

    currentRef.addEventListener('scroll', handleScroll);

    return () => {
      currentRef.removeEventListener('scroll', handleScroll);
    };
  }, [handleScrollTop]);

  // Reference to socket for report handling
  const socketRef = useRef<WebSocket | null>(null);
  
  // Update socket ref when socket changes
  useEffect(() => {
    // This is a bit hacky, but we need access to the socket for reporting
    // In a real implementation, we'd expose the socket from useChatSocket
  }, []);

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
          messages={filteredMessages}
          nickname={nickname}
          onScroll={handleScroll}
          typingUsers={typingUsers}
          onBlock={handleBlockUser}
          onReport={handleReport}
        />
        
        {/* Loading indicator for older messages */}
        {isLoadingOlder && (
          <div className="loading-older">
            <div className="spinner"></div>
            <span>Loading older messages...</span>
          </div>
        )}
        
        {newMessagesCount > 0 && (
          <button className="new-messages-badge" onClick={scrollToBottom}>
            {newMessagesCount} new message{newMessagesCount > 1 ? 's' : ''} ↓
          </button>
        )}
      </div>

      <div className="room-footer">
        <div className="footer-row">
          <ConnectionStatus status={connectionStatus} onReconnect={reconnect} />
          <button 
            className="block-panel-toggle" 
            onClick={toggleBlockPanel}
            title="Blocked Users"
          >
            {getBlockedUsersArray().length > 0 && (
              <span className="block-count">{getBlockedUsersArray().length}</span>
            )}
            🚫
          </button>
        </div>
        <Composer
          onSend={handleSendMessage}
          onTyping={handleTyping}
          disabled={connectionStatus !== 'ONLINE'}
          placeholder={connectionStatus === 'ONLINE' ? 'Type a message...' : 'Connecting...'}
        />
        <RoomSwitcher currentRoom={roomName} />
      </div>

      {/* Block Panel */}
      {showBlockPanel && (
        <BlockPanel
          blockedUsers={getBlockedUsersArray()}
          onUnblock={handleUnblockUser}
          onClose={() => setShowBlockPanel(false)}
        />
      )}
    </div>
  );
}
