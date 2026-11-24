import { ConnectionStatus as ConnectionStatusType } from '../types';
import '../styles/ConnectionStatus.css';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  onReconnect?: () => void;
}

export default function ConnectionStatus({ status, onReconnect }: ConnectionStatusProps) {
  if (status === 'ONLINE') return null;

  return (
    <div className={`connection-status ${status}`}>
      <span className="status-indicator"></span>
      <span className="status-text">
        {status === 'RECONNECTING' ? 'Reconnecting...' : 'Offline'}
      </span>
      {status === 'OFFLINE' && onReconnect && (
        <button onClick={onReconnect} className="reconnect-button">
          Retry
        </button>
      )}
    </div>
  );
}
