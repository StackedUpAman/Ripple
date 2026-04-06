// pages/groupChat.tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ChatApp } from './ChatApp';
import { initSocket, getSocket } from '../utilities/socket';
import { connectSocket } from '../utilities/connect.socket';

type User = {
  id: string;
  _id?: string;
  name?: string;
  username?: string;
  email: string;
};

export default function GroupChatPage() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  // Instant redirect before rendering any chat framework or connecting sockets
  if (!token || token === 'undefined' || !userStr || userStr === 'undefined') {
    return <Navigate to="/login" replace />;
  }

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    document.title = 'Chat - Ripple';

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      // Initialize socket if not already connected
      connectSocket();
      if (!getSocket()?.connected) {
        initSocket(token);
      }
    } catch (error) {
      console.error('Failed to parse user data:', error);
      // If user strings are corrupted somehow, clear and force reload
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }, [token, userStr]);

  // Loading state while parsing
  if (!user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading chat...</p>
      </div>
    );
  }

  const userId = user.id || user._id || '';
  const userName = user.name || user.username || user.email.split('@')[0] || 'User';
  
  return (
    <ChatApp 
      currentUserId={userId.toString()} 
      currentUserName={userName} 
    />
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#f0f2f5',
  },
  spinner: {
    width: 48,
    height: 48,
    border: '4px solid #e0e0e0',
    borderTopColor: '#25D366',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: 16,
    color: '#667781',
    fontSize: 14,
  },
};