import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRooms, Group, DirectChat, Message } from '../hooks/useRooms';

type Props = {
  currentUserId: string;
  currentUserName: string;
};

const formatTime = (ts: string) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const initials = (name: string = "") =>
  name.split(' ').map((n) => n.charAt(0)).slice(0, 2).join('').toUpperCase();

const getAvatarColor = (id: string) => {
  const colors = ['#5865F2', '#EB459E', '#ED4245', '#FEE75C', '#57F287', '#9146FF'];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return colors[sum % colors.length];
};

export const ChatApp: React.FC<Props> = ({ currentUserId, currentUserName }) => {
  const {
    groups,
    directChats,
    messages,
    isLoading,
    error,
    createGroup,
    joinGroup,
    leaveGroup,
    pairDirectChat,
    sendGroupMessage,
    sendDirectMessage,
    fetchGroupMessages,
    fetchDirectMessages,
    startDirectChatListener
  } = useRooms(currentUserId);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeChannel, setActiveChannel] = useState<'group' | string>('group'); // 'group' or chatId
  
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [maxCapacity, setMaxCapacity] = useState<number | ''>('');
  const [isSending, setIsSending] = useState(false);

  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  const myGroups = useMemo(() => groups.filter(g => g.isMember), [groups]);

  // Auto-select first group
  useEffect(() => {
    if (myGroups.length > 0 && !selectedGroup) {
      setSelectedGroup(myGroups[0]);
    }
  }, [myGroups, selectedGroup]);

  // Handle group change: Connect sockets & Load history
  useEffect(() => {
    if (selectedGroup) {
      setActiveChannel('group');
      joinGroup(currentUserId, selectedGroup.id);
      fetchGroupMessages(currentUserId, selectedGroup.id);
      startDirectChatListener(selectedGroup.id);
    }
  }, [selectedGroup?.id]);

  // Handle Active Channel Change
  useEffect(() => {
    if (selectedGroup && activeChannel !== 'group') {
      fetchDirectMessages(currentUserId, selectedGroup.id, activeChannel);
    }
  }, [activeChannel, selectedGroup?.id]);

  // Auto-scroll messages
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, activeChannel, selectedGroup?.id]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !selectedGroup || isSending) return;

    setIsSending(true);
    setNewMessage('');

    try {
      if (activeChannel === 'group') {
        await sendGroupMessage(currentUserId, selectedGroup.id, text);
      } else {
        await sendDirectMessage(currentUserId, selectedGroup.id, activeChannel, text);
      }
    } catch (err) {
      setNewMessage(text);
      console.error('Failed to send:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleInitiateDirectChat = async (targetMemberId: string) => {
      if (!selectedGroup) return;
      try {
         const chat = await pairDirectChat(currentUserId, selectedGroup.id, targetMemberId);
         setActiveChannel(chat.id);
      } catch (err) {
        alert("Failed to start direct chat. Either it's you, or a network error.");
      }
  };

  const currentMessages = useMemo(() => {
    if (!selectedGroup) return [];
    const targetId = activeChannel === 'group' ? selectedGroup.id : activeChannel;
    return messages[targetId] || [];
  }, [messages, selectedGroup, activeChannel]);

  if (isLoading && groups.length === 0) {
    return <div style={styles.loadingContainer}>Loading application...</div>;
  }

  // Active channel title helper
  let activeChannelName = "# group-general";
  if (activeChannel !== 'group' && selectedGroup) {
     const dc = (directChats[selectedGroup.id] || []).find(c => c.id === activeChannel);
     if (dc) activeChannelName = `🔒 ${dc.targetName}`;
  }

  return (
    <div style={styles.appContainer}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1E1F22; }
        ::-webkit-scrollbar-thumb { background: #111214; border-radius: 3px; }
      `}</style>
      
      {/* Pane 1: Group Icons (Servers) */}
      <nav style={styles.serversPane}>
        {myGroups.map(g => (
          <div 
            key={g.id} 
            title={g.room_name}
            style={{
              ...styles.serverIcon,
              ...(g.id === selectedGroup?.id ? styles.serverIconActive : {}),
            }}
            onClick={() => setSelectedGroup(g)}
          >
            {initials(g.room_name)}
          </div>
        ))}
        <div style={styles.serverIconDivider} />
        <div 
           style={{...styles.serverIcon, background: '#3BA55C', color: '#fff'}}
           onClick={() => setShowCreateModal(true)}
           title="Create Group"
        >
          +
        </div>
        <div 
           style={{...styles.serverIcon, background: '#2B2D31', color: '#3BA55C', marginTop: 8}}
           onClick={() => setShowDiscoverModal(true)}
           title="Discover Groups"
        >
          🧭
        </div>
      </nav>

      {/* Pane 2: Channels inside Group */}
      <aside style={styles.channelsPane}>
        {selectedGroup ? (
          <>
            <header style={styles.groupHeader}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h2 style={{ fontSize: 16, margin: 0 }}>{selectedGroup.room_name}</h2>
                 <button 
                    onClick={async (e) => {
                       e.stopPropagation();
                       if(window.confirm(`Leave ${selectedGroup.room_name}?`)) {
                          try {
                             await leaveGroup(currentUserId, selectedGroup.id);
                             setSelectedGroup(null);
                          } catch (err) {
                             alert("You cannot leave a room you created!");
                          }
                       }
                    }}
                    style={styles.leaveGroupBtn}
                    title="Leave Server"
                 >
                    🚪
                 </button>
              </div>
            </header>
            
            <div style={styles.channelScrollArea}>
                <div style={styles.categoryTitle}>MAIN CHANNEL</div>
                <div 
                  style={{
                    ...styles.channelItem,
                    ...(activeChannel === 'group' ? styles.channelItemActive : {})
                  }}
                  onClick={() => setActiveChannel('group')}
                >
                  <span style={styles.channelHash}>#</span> group-general
                </div>

                <div style={styles.categoryTitle}>DIRECT CHATS</div>
                {(directChats[selectedGroup.id] || []).map(dc => (
                  <div 
                    key={dc.id}
                    style={{
                      ...styles.channelItem,
                      ...(activeChannel === dc.id ? styles.channelItemActive : {})
                    }}
                    onClick={() => setActiveChannel(dc.id)}
                  >
                    <span style={styles.channelHash}>🔒</span> {dc.targetName}
                  </div>
                ))}

                <div style={styles.categoryTitle}>GROUP MEMBERS</div>
                {selectedGroup.members?.map(m => (
                  <div 
                    key={m.id}
                    style={{...styles.channelItem, cursor: 'default', display: 'flex', justifyContent: 'space-between'}}
                  >
                    <div style={{display: 'flex', alignItems: 'center'}}>
                       <div style={{...styles.memberAvatar, background: getAvatarColor(m.id)}}>
                         {initials(m.name)}
                       </div>
                       {m.name}
                    </div>
                    {/* Send Message Button inside member list */}
                    <button 
                       onClick={() => handleInitiateDirectChat(m.id)}
                       style={styles.dmButton}
                       title="Start Direct Chat"
                    >
                       💬
                    </button>
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div style={{padding: 20, color: '#949BA4'}}>No group selected</div>
        )}

        {/* User Profile / Logout footer */}
        <div style={styles.userFooter}>
           <div style={{...styles.serverIcon, width: 32, height: 32, fontSize: 14, margin: 0, borderRadius: '50%'}}>
             {initials(currentUserName)}
           </div>
           <div style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: 'bold' }}>{currentUserName}</div>
           <button 
              onClick={() => {
                 localStorage.removeItem('token');
                 localStorage.removeItem('user');
                 window.location.href = '/login';
              }}
              style={{ background: 'none', border: 'none', color: '#ED4245', cursor: 'pointer', fontSize: 18 }}
              title="Logout"
           >
             ⏻
           </button>
        </div>
      </aside>

      {/* Pane 3: Chat Area */}
      <main style={styles.chatPane}>
        {selectedGroup ? (
           <>
              <header style={styles.chatHeader}>
                 <h3 style={{ margin: 0, fontSize: 16 }}>{activeChannelName}</h3>
              </header>

              <div ref={chatBodyRef} style={styles.messageList}>
                 {currentMessages.length === 0 && (
                   <div style={styles.noMessages}>Be the first to say something!</div>
                 )}
                 {currentMessages.map(msg => (
                   <div key={msg.id} style={styles.messageRow}>
                     <div style={{...styles.msgAvatar, background: getAvatarColor(msg.senderId)}} />
                     <div style={styles.msgContentBlock}>
                       <header style={styles.msgHeader}>
                         <span style={{ fontWeight: 'bold', color: '#F2F3F5', marginRight: 8 }}>{msg.sender}</span>
                         <span style={{ fontSize: 12, color: '#949BA4' }}>{formatTime(msg.timestamp)}</span>
                       </header>
                       <div style={styles.msgText}>{msg.text}</div>
                     </div>
                   </div>
                 ))}
              </div>

              <div style={styles.inputArea}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={"Message " + activeChannelName}
                  style={styles.chatInput}
                  disabled={isSending}
                />
              </div>
           </>
        ) : (
           <div style={styles.noGroupSelected}>
              <h2>Welcome to Ripple</h2>
              <p>Join or create a server to start chatting.</p>
           </div>
        )}
      </main>

      {/* Modals */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ color: '#F2F3F5', margin: 0 }}>Create Server</h3>
               <button onClick={() => setShowCreateModal(false)} style={styles.closeButton}>✕</button>
            </div>
            <input
              autoFocus
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder="Server Name"
              style={{...styles.modalInput, marginTop: 16, marginBottom: 8}}
            />
            <input
              type="number"
              min="0"
              value={maxCapacity}
              onChange={e => setMaxCapacity(e.target.value === '' ? '' : parseInt(e.target.value))}
              placeholder="Max Joinees (Leave empty for Unlimited)"
              style={styles.modalInput}
            />
            <button 
              onClick={async () => {
                await createGroup(currentUserId, newRoomName, typeof maxCapacity === 'number' ? maxCapacity : 0);
                setShowCreateModal(false);
                setNewRoomName('');
                setMaxCapacity('');
              }}
              style={styles.modalCreateBtn}
              disabled={!newRoomName.trim()}
            >
               Create
            </button>
          </div>
        </div>
      )}

      {showDiscoverModal && (
        <div style={styles.modalOverlay} onClick={() => setShowDiscoverModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ color: '#F2F3F5', margin: 0 }}>Discover Servers</h3>
               <button onClick={() => setShowDiscoverModal(false)} style={styles.closeButton}>✕</button>
            </div>
            
            <div style={{ maxHeight: 400, overflowY: 'auto', marginTop: 16 }}>
               {groups.filter(g => !g.isMember).map(g => {
                  const memCount = g.members?.length || 0;
                  const isFull = g.max_capacity ? memCount >= g.max_capacity : false;

                  return (
                  <div key={g.id} style={styles.discoverItem}>
                     <div style={{...styles.serverIcon, width: 40, height: 40, background: getAvatarColor(g.id), borderRadius: '50%'}}>
                       {initials(g.room_name)}
                     </div>
                     <div style={{ flex: 1, marginLeft: 12 }}>
                       <div style={{ fontWeight: 'bold', color: '#F2F3F5' }}>{g.room_name}</div>
                       <div style={{ fontSize: 12, color: isFull ? '#ED4245' : '#949BA4' }}>
                         {memCount} / {g.max_capacity || 'Unlimited'} members {isFull && '(Full)'}
                       </div>
                     </div>
                     <button 
                        onClick={async () => {
                           if (isFull) return;
                           await joinGroup(currentUserId, g.id);
                           window.location.reload(); // Refresh fully to update sockets and lists
                        }}
                        style={{
                           ...styles.joinButton,
                           backgroundColor: isFull ? '#4F545C' : '#248046',
                           cursor: isFull ? 'not-allowed' : 'pointer'
                        }}
                        disabled={isFull}
                     >
                       Join
                     </button>
                  </div>
               )})}
               {groups.filter(g => !g.isMember).length === 0 && (
                  <div style={{ color: '#949BA4', textAlign: 'center', padding: 20 }}>No new servers to join!</div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#313338',
    color: '#DCDDDE',
    fontFamily: '"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: '#fff',
    backgroundColor: '#313338',
  },
  
  // Servers Pane
  serversPane: {
    width: 72,
    backgroundColor: '#1E1F22',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 12,
    gap: 8,
    flexShrink: 0
  },
  serverIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#313338',
    borderRadius: 24, // Circle
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    cursor: 'pointer',
    transition: '0.2s all',
    color: '#DBDEE1'
  },
  serverIconActive: {
    borderRadius: 16, // Squircle
    backgroundColor: '#5865F2',
    color: '#fff'
  },
  serverIconDivider: {
    width: 32,
    height: 2,
    backgroundColor: '#313338',
    margin: '4px 0',
  },

  // Channels Pane
  channelsPane: {
    width: 280,
    backgroundColor: '#2B2D31',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0
  },
  groupHeader: {
    padding: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    color: '#F2F3F5',
  },
  leaveGroupBtn: {
    background: 'none',
    border: 'none',
    color: '#ED4245',
    cursor: 'pointer',
    fontSize: 16,
    padding: 0
  },
  channelScrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 8px',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#949BA4',
    padding: '18px 8px 4px 8px',
  },
  channelItem: {
    padding: '6px 8px',
    margin: '2px 0',
    borderRadius: 4,
    color: '#949BA4',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 500
  },
  channelItemActive: {
    backgroundColor: '#404249',
    color: '#F2F3F5',
  },
  channelHash: {
    fontSize: 18,
    marginRight: 6,
    color: '#80848E'
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    marginRight: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold'
  },
  dmButton: {
    background: '#5865F2',
    border: 'none',
    color: '#fff',
    borderRadius: 4,
    width: 28,
    height: 28,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chat Pane
  chatPane: {
    flex: 1,
    backgroundColor: '#313338',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  chatHeader: {
    height: 48,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    flexShrink: 0,
    color: '#F2F3F5',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
  },
  noMessages: {
    padding: 20,
    textAlign: 'center',
    color: '#949BA4'
  },
  noGroupSelected: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#949BA4'
  },
  messageRow: {
    display: 'flex',
    padding: '4px 16px',
    marginTop: 12,
  },
  msgAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    marginRight: 16,
    flexShrink: 0
  },
  msgContentBlock: {
    flex: 1
  },
  msgHeader: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: 4
  },
  msgText: {
    color: '#DBDEE1',
    lineHeight: 1.375
  },
  inputArea: {
    padding: '0 16px 24px 16px',
  },
  chatInput: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#383A40',
    border: 'none',
    borderRadius: 8,
    color: '#DCDDDE',
    fontSize: 15,
    outline: 'none',
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#313338',
    padding: 24,
    borderRadius: 8,
    width: 400,
    maxWidth: '90%'
  },
  modalInput: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1E1F22',
    border: 'none',
    borderRadius: 4,
    color: '#DCDDDE',
    marginBottom: 16
  },
  modalCreateBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#5865F2',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#949BA4',
    cursor: 'pointer',
    fontSize: 18
  },
  discoverItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#2B2D31',
    borderRadius: 8,
    marginBottom: 8
  },
  joinButton: {
    padding: '6px 16px',
    backgroundColor: '#248046',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};