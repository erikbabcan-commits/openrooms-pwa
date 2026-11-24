import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback, useMemo } from 'react';
import { Message } from '../types';
import { groupMessages } from '../lib/groupMessages';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import '../styles/MessageList.css';

interface MessageListProps {
  messages: Message[];
  nickname: string;
  onScroll?: (isAtBottom: boolean) => void;
  typingUsers: Set<string>;
  onBlock?: (nickname: string) => void;
  onReport?: (messageId: string, reportedNickname: string) => void;
}

// Virtualization threshold
const VIRTUALIZATION_THRESHOLD = 80;

export default forwardRef<HTMLDivElement, MessageListProps>(function MessageList(
  { messages, nickname, onScroll, typingUsers, onBlock, onReport },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number }>({ start: 0, end: 20 });
  const scrollTimeoutRef = useRef<number | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  const itemHeightsRef = useRef<Map<number, number>>(new Map());

  // Expose container ref to parent
  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

  // Group messages by user with 5-minute gap
  const groupedMessages = useMemo(() => groupMessages(messages, nickname), [messages, nickname]);

  // Use virtualization for large message lists
  const useVirtualization = groupedMessages.length > VIRTUALIZATION_THRESHOLD;

  // Calculate visible items based on scroll position
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current || !useVirtualization) {
      return { start: 0, end: groupedMessages.length };
    }

    const { scrollTop, clientHeight } = containerRef.current;
    const buffer = 5; // Extra items to render above/below

    // Estimate item height (average ~80px per grouped message)
    const avgItemHeight = 80;
    const startIndex = Math.max(0, Math.floor(scrollTop / avgItemHeight) - buffer);
    const visibleItems = Math.ceil(clientHeight / avgItemHeight) + buffer * 2;
    const endIndex = Math.min(groupedMessages.length, startIndex + visibleItems);

    return { start: startIndex, end: endIndex };
  }, [groupedMessages.length, useVirtualization]);

  // Handle scroll events with debouncing
  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    isScrollingRef.current = true;
    
    scrollTimeoutRef.current = window.setTimeout(() => {
      const atBottom = checkAtBottom();
      setIsAtBottom(atBottom);
      onScroll?.(atBottom);
      
      if (useVirtualization) {
        setVisibleRange(calculateVisibleRange());
      }
      
      isScrollingRef.current = false;
    }, 150);
  }, [checkAtBottom, onScroll, useVirtualization, calculateVisibleRange]);

  // Check if at bottom
  const checkAtBottom = useCallback(() => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 80; // pixels from bottom
    const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    return atBottom;
  }, []);

  // Scroll to bottom when at bottom and new message arrives
  const scrollToBottomIfNeeded = useCallback(() => {
    if (!containerRef.current) return;
    
    const atBottom = checkAtBottom();
    setIsAtBottom(atBottom);
    
    if (atBottom) {
      // Save current scroll height before new messages are rendered
      const currentScrollHeight = containerRef.current.scrollHeight;
      
      // Force reflow to get updated scroll height
      setTimeout(() => {
        if (containerRef.current) {
          const newScrollHeight = containerRef.current.scrollHeight;
          const scrollDiff = newScrollHeight - currentScrollHeight;
          
          containerRef.current.scrollTo({
            top: containerRef.current.scrollTop + scrollDiff,
            behavior: 'smooth',
          });
        }
      }, 0);
    }
  }, [checkAtBottom]);

  // Check on mount and when messages change
  useEffect(() => {
    scrollToBottomIfNeeded();
  }, [messages, scrollToBottomIfNeeded]);

  // Update visible range on scroll
  useEffect(() => {
    if (useVirtualization) {
      setVisibleRange(calculateVisibleRange());
    }
  }, [useVirtualization, calculateVisibleRange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle reconnect without scroll jump
  const handleMessagesChange = useCallback(() => {
    if (containerRef.current) {
      const wasAtBottom = checkAtBottom();
      setIsAtBottom(wasAtBottom);
      
      if (wasAtBottom) {
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        }, 0);
      }
    }
  }, [checkAtBottom]);

  useEffect(() => {
    handleMessagesChange();
  }, [messages, handleMessagesChange]);

  // Render visible messages
  const visibleMessages = useVirtualization
    ? groupedMessages.slice(visibleRange.start, visibleRange.end)
    : groupedMessages;

  // Render placeholder for virtualized items above
  const renderTopPlaceholder = useVirtualization && visibleRange.start > 0 && (
    <div 
      className="virtual-placeholder" 
      style={{ height: `${visibleRange.start * 80}px` }}
    />
  );

  // Render placeholder for virtualized items below
  const renderBottomPlaceholder = useVirtualization && visibleRange.end < groupedMessages.length && (
    <div 
      className="virtual-placeholder" 
      style={{ height: `${(groupedMessages.length - visibleRange.end) * 80}px` }}
    />
  );

  if (groupedMessages.length === 0) {
    return (
      <div
        ref={containerRef}
        className="message-list"
        onScroll={handleScroll}
      >
        <div className="messages-container">
          <div className="empty-state">
            <p>No messages yet. Be the first to say something!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="message-list"
      onScroll={handleScroll}
    >
      <div className="messages-container">
        {renderTopPlaceholder}
        
        {visibleMessages.map((group, index) => (
          <div
            key={group.id}
            className={`message-group ${group.isOwn ? 'own' : 'other'}`}
            data-index={useVirtualization ? visibleRange.start + index : index}
          >
            <MessageBubble
              messages={group.messages}
              nickname={group.nickname}
              isOwn={group.isOwn}
              showTimestamp={group.showTimestamp}
              ts={group.ts}
              isLastInGroup={useVirtualization ? 
                (visibleRange.start + index) === groupedMessages.length - 1 : 
                index === groupedMessages.length - 1}
              onBlock={onBlock}
              onReport={onReport}
            />
          </div>
        ))}
        
        {renderBottomPlaceholder}
        
        {typingUsers.size > 0 && (
          <TypingIndicator users={Array.from(typingUsers)} />
        )}
      </div>
    </div>
  );
});
