const QUEUE_KEY = 'openrooms_outbound_queue';

interface QueuedMessage {
  id: string;
  text: string;
  timestamp: number;
  roomName: string;
}

export const outboundQueue = {
  enqueue(message: QueuedMessage): void {
    try {
      const queue = this.getQueue();
      queue.push(message);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to save to outbound queue:', e);
    }
  },

  dequeue(): QueuedMessage | null {
    try {
      const queue = this.getQueue();
      if (queue.length === 0) return null;
      const message = queue.shift()!;
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      return message;
    } catch (e) {
      console.error('Failed to read from outbound queue:', e);
      return null;
    }
  },

  peek(): QueuedMessage | null {
    try {
      const queue = this.getQueue();
      return queue.length > 0 ? queue[0] : null;
    } catch (e) {
      return null;
    }
  },

  getQueue(): QueuedMessage[] {
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(QUEUE_KEY);
    } catch (e) {
      console.error('Failed to clear outbound queue:', e);
    }
  },

  size(): number {
    return this.getQueue().length;
  },
};
