import { Message } from '../types';

interface GroupedMessage {
  id: string;
  messages: Message[];
  nickname: string;
  isOwn: boolean;
  showTimestamp: boolean;
  ts: number;
}

const MAX_GROUP_GAP_MS = 5 * 60 * 1000; // 5 minutes

export function groupMessages(messages: Message[], currentNickname: string): GroupedMessage[] {
  if (messages.length === 0) return [];

  const grouped: GroupedMessage[] = [];
  let currentGroup: GroupedMessage | null = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isOwn = msg.nickname === currentNickname;

    // Start a new group if:
    // - First message
    // - Different user
    // - Gap > 5 minutes from previous message in group
    if (!currentGroup || 
        currentGroup.nickname !== msg.nickname ||
        (currentGroup.messages.length > 0 && 
         msg.ts - currentGroup.messages[currentGroup.messages.length - 1].ts > MAX_GROUP_GAP_MS)) {
      
      // Push previous group
      if (currentGroup) {
        grouped.push(currentGroup);
      }

      // Start new group
      currentGroup = {
        id: `${msg.id}-group`,
        messages: [msg],
        nickname: msg.nickname,
        isOwn,
        showTimestamp: true,
        ts: msg.ts,
      };
    } else {
      // Add to current group
      currentGroup.messages.push(msg);
    }
  }

  // Push the last group
  if (currentGroup) {
    grouped.push(currentGroup);
  }

  return grouped;
}

// Helper to check if a string is mostly emoji
export function isEmojiOnly(text: string): boolean {
  // Match emoji characters (simplified)
  const emojiRegex = /^([\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{2B55}\u{200D}\u{23CF}\u{23E9}\u{23EA}\u{23EB}\u{23EC}\u{23F0}\u{23F3}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}\u{26AB}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26E9}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}\u{2709}\u{270A}\u{270B}\u{270C}\u{270F}\u{2712}\u{2714}\u{2716}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{2753}-\u{2755}\u{2757}\u{2764}\u{2767}\u{2795}-\u{2797}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}\u{FE0F}\u{20E3}]+)$/u;
  return emojiRegex.test(text);
}

// Helper to format time
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
