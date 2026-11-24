import { useState, useEffect } from 'react';

const NICKNAME_KEY = 'openrooms_nickname';

export function useLocalStorageNickname() {
  const [nickname, setNickname] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem(NICKNAME_KEY);
    if (stored) {
      setNickname(stored);
    }
  }, []);

  const saveNickname = (newNickname: string) => {
    const sanitized = newNickname.trim().slice(0, 50);
    if (sanitized) {
      localStorage.setItem(NICKNAME_KEY, sanitized);
      setNickname(sanitized);
    }
  };

  const clearNickname = () => {
    localStorage.removeItem(NICKNAME_KEY);
    setNickname('');
  };

  return { nickname, saveNickname, clearNickname };
}
