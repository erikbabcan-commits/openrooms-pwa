import { useEffect, useCallback } from 'react';
import '../styles/Toast.css';

interface ToastProps {
  text: string;
  type: 'error' | 'info' | 'success';
  onDismiss?: () => void;
  duration?: number;
}

export default function Toast({ text, type, onDismiss, duration = 3000 }: ToastProps) {
  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  return (
    <div className={`toast ${type} fade-in`}>
      <span className="toast-icon">
        {type === 'error' && '⚠️'}
        {type === 'info' && 'ℹ️'}
        {type === 'success' && '✅'}
      </span>
      <span className="toast-text">{text}</span>
      <button className="toast-dismiss" onClick={handleDismiss}>
        ×
      </button>
    </div>
  );
}
