import { useState, useCallback, useEffect } from 'react';

const BLOCKED_USERS_KEY = 'openrooms_blocked_users';

interface BlockedUsersStorage {
  [roomName: string]: string[]; // Array of blocked nicknames
}

export function useBlockedUsers(roomName: string) {
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());

  // Load blocked users for this room
  useEffect(() => {
    if (!roomName) {
      setBlockedUsers(new Set());
      return;
    }

    try {
      const storage = localStorage.getItem(BLOCKED_USERS_KEY);
      const parsed: BlockedUsersStorage = storage ? JSON.parse(storage) : {};
      const roomBlocked = parsed[roomName] || [];
      setBlockedUsers(new Set(roomBlocked));
    } catch (e) {
      console.error('Failed to load blocked users:', e);
      setBlockedUsers(new Set());
    }
  }, [roomName]);

  // Save blocked users to localStorage
  const saveBlockedUsers = useCallback((users: Set<string>) => {
    if (!roomName) return;

    try {
      const storage = localStorage.getItem(BLOCKED_USERS_KEY);
      const parsed: BlockedUsersStorage = storage ? JSON.parse(storage) : {};
      parsed[roomName] = Array.from(users);
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to save blocked users:', e);
    }
  }, [roomName]);

  // Block a user
  const blockUser = useCallback((nickname: string) => {
    setBlockedUsers((prev) => {
      const newSet = new Set(prev);
      newSet.add(nickname);
      saveBlockedUsers(newSet);
      return newSet;
    });
  }, [saveBlockedUsers]);

  // Unblock a user
  const unblockUser = useCallback((nickname: string) => {
    setBlockedUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(nickname);
      saveBlockedUsers(newSet);
      return newSet;
    });
  }, [saveBlockedUsers]);

  // Check if user is blocked
  const isBlocked = useCallback((nickname: string): boolean => {
    return blockedUsers.has(nickname);
  }, [blockedUsers]);

  // Toggle block
  const toggleBlock = useCallback((nickname: string) => {
    if (blockedUsers.has(nickname)) {
      unblockUser(nickname);
    } else {
      blockUser(nickname);
    }
  }, [blockedUsers, blockUser, unblockUser]);

  // Get all blocked users as array
  const getBlockedUsersArray = useCallback((): string[] => {
    return Array.from(blockedUsers);
  }, [blockedUsers]);

  return {
    blockedUsers,
    blockUser,
    unblockUser,
    toggleBlock,
    isBlocked,
    getBlockedUsersArray,
  };
}
