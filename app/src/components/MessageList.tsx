import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import '../styles/MessageList.css';

interface MessageListProps {
  messages: Message[];
  nickname: string;
  onScroll?: (isAtBottom: boolean) => void;
  typingUsers: Set<string>;
}

export default forwardRef<HTMLDivElement, MessageListProps>(function MessageList(
  { messages, nickname, onScroll, typingUsers },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Expose container ref to parent
  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

  // Check if at bottom
  const checkAtBottom = () => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 80; // pixels from bottom
    const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    if (atBottom !== isAtBottom) {
      setIsAtBottom(atBottom);
      onScroll?.(atBottom);
    }
    
    return atBottom;
  };

  // Handle scroll events with debouncing
  const handleScroll = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = window.setTimeout(() => {
      checkAtBottom();
    }, 100);
  };

  // Check on mount and when messages change
  useEffect(() => {
    checkAtBottom();
  }, [messages]);

  // Scroll to bottom when at bottom
  useEffect(() => {
    if (isAtBottom && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isAtBottom]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="message-list"
      onScroll={handleScroll}
    >
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Be the first to say something!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.nickname === nickname}
            />
          ))
        )}
        
        {typingUsers.size > 0 && (
          <TypingIndicator users={Array.from(typingUsers)} />
        )}
      </div>
    </div>
  );
});
