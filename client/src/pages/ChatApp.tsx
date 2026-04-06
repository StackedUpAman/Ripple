import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRooms, Group, DirectChat, Message } from '../hooks/useRooms';
import {
  IconSearch, IconBell, IconLogout, IconMoon, IconSun,
  IconMoodSmile, IconPhoto, IconSend, IconPlus, IconCompass,
  IconHash, IconLock, IconMessageCircle, IconDoorExit, IconUsers, IconUser, IconRipple
} from '@tabler/icons-react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';

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
  const colors = ['#15c3c6', '#EB459E', '#ED4245', '#FEE75C', '#57F287', '#9146FF'];
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

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeChannel, setActiveChannel] = useState<'group' | string>('group');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
    return (
      <div className={`flex items-center justify-center h-screen w-screen font-sans ${theme === 'dark' ? 'bg-[#0f1115] text-[#15c3c6]' : 'bg-slate-50 text-slate-800'}`}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-t-2 border-[#15c3c6] animate-spin mb-4"></div>
          Loading...
        </div>
      </div>
    );
  }

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Colors mapping based on theme
  const colors = {
    bgApp: theme === 'dark' ? 'bg-[#0f1115]' : 'bg-[#f4f6b]',
    bgNav: theme === 'dark' ? 'bg-[#15171c]' : 'bg-[#ffffff]',
    bgPaneLeft: theme === 'dark' ? 'bg-[#15171c]' : 'bg-[#ffffff]',
    bgPaneMid: theme === 'dark' ? 'bg-[#1a1c23]' : 'bg-[#f8fafc]',
    bgPaneRight: theme === 'dark' ? 'bg-[#0f1115]' : 'bg-[#f4f6fb]',
    bgHover: theme === 'dark' ? 'hover:bg-[#2a2d35]' : 'hover:bg-[#15c3c6]/10',
    groupBgDefault: theme === 'dark' ? 'bg-[#2a2d35] text-white' : 'bg-slate-200 text-slate-700',
    textMain: theme === 'dark' ? 'text-[#e2e8f0]' : 'text-slate-800',
    textMuted: theme === 'dark' ? 'text-[#8b92a5]' : 'text-slate-500',
    accent: 'text-[#15c3c6]',
    bgAccent: 'bg-[#15c3c6]',
    inputBg: theme === 'dark' ? 'bg-[#2a2d35]' : 'bg-[#f1f5f9]',
    bubbleRecv: theme === 'dark' ? 'bg-[#2a2d35] text-[#e2e8f0]' : 'bg-slate-100 text-slate-800',
    bubbleSend: 'bg-[#15c3c6] text-[#0f1115]',
  };

  return (
    <div className={`flex flex-col h-screen w-screen font-sans ${theme === 'dark' ? 'dark' : ''} ${colors.bgApp} ${colors.textMain} transition-colors duration-300`}>
      
      {/* TOP NAVBAR */}
      <header className={`h-16 flex items-center justify-between px-6 flex-shrink-0 ${colors.bgNav} border-b ${theme === 'dark' ? 'border-[#1a1c23]' : 'border-slate-200'} z-20`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#15c3c6]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M4 12a8 8 0 0 1 16 0M4 16a4 4 0 0 1 8 0M4 8a12 12 0 0 1 24 0" />
            </svg>
          </div>
          <h1 className={`text-xl font-bold tracking-tight ${colors.textMain}`}>
            Ripple<span className="text-[#15c3c6]">.</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block group">
            <IconSearch className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.textMuted} group-focus-within:text-[#15c3c6] transition-colors`} />
            <input 
              type="text" 
              placeholder="Search..." 
              className={`pl-10 pr-4 py-2 rounded-full ${colors.inputBg} border-none outline-none text-sm w-64 ${colors.textMain} placeholder-slate-500 focus:ring-1 focus:ring-[#15c3c6] transition-all`}
            />
          </div>
          
          <button onClick={toggleTheme} className={`${colors.textMuted} hover:text-[#15c3c6] transition-colors`}>
            {theme === 'dark' ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
          </button>
          <button className={`${colors.textMuted} hover:text-[#15c3c6] transition-colors relative`}>
            <IconBell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#15c3c6] rounded-full border border-[#15171c]"></span>
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className={`flex items-center gap-2 ${colors.textMuted} hover:text-rose-400 transition-colors text-sm font-medium`}
          >
            <IconLogout className="w-5 h-5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* 3 PANES LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* PANE 1: GROUPS */}
        <nav className={`w-[84px] flex-shrink-0 flex flex-col items-center py-6 gap-4 ${colors.bgPaneLeft} z-10`}>
          {myGroups.map(g => (
            <div
              key={g.id}
              title={g.room_name}
              onClick={() => setSelectedGroup(g)}
              className="relative group cursor-pointer flex items-center justify-center w-full"
            >
              {/* Active Indicator */}
              <div className={`absolute left-0 w-1 rounded-r-full transition-all duration-300 ${g.id === selectedGroup?.id ? 'h-8 bg-[#15c3c6]' : 'h-0 bg-transparent group-hover:h-4 group-hover:bg-[#15c3c6]/50'}`}></div>
              
              <div className={`w-12 h-12 flex items-center justify-center font-bold text-[15px] transition-all duration-300 ${
                g.id === selectedGroup?.id 
                  ? 'bg-[#15c3c6] text-[#0f1115] rounded-2xl shadow-lg shadow-[#15c3c6]/20' 
                  : `${colors.groupBgDefault} rounded-[24px] hover:rounded-2xl ${colors.bgHover}`
              }`}>
                {initials(g.room_name)}
              </div>
            </div>
          ))}
          
          <div className="w-8 h-[2px] bg-[#2a2d35] my-2 rounded-full"></div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            title="Create Group"
            className={`w-12 h-12 flex items-center justify-center rounded-[24px] hover:rounded-2xl ${theme === 'dark' ? 'bg-[#2a2d35]' : 'bg-slate-200'} text-[#15c3c6] hover:bg-[#15c3c6] hover:text-[#0f1115] transition-all duration-300`}
          >
            <IconPlus className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowDiscoverModal(true)}
            title="Discover Groups"
            className={`w-12 h-12 flex items-center justify-center rounded-[24px] hover:rounded-2xl ${theme === 'dark' ? 'bg-[#2a2d35]' : 'bg-slate-200'} text-[#15c3c6] hover:bg-[#15c3c6] hover:text-[#0f1115] transition-all duration-300`}
          >
            <IconCompass className="w-6 h-6" />
          </button>
        </nav>

        {/* PANE 2: CHANNELS & MEMBERS */}
        <aside className={`w-[280px] flex-shrink-0 flex flex-col ${colors.bgPaneMid}`}>
          {selectedGroup ? (
            <>
              {/* Group Header */}
              <header className="p-5 pb-2">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[12px] font-bold text-[#15c3c6] uppercase tracking-[0.15em]">CHATS</h2>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Leave ${selectedGroup.room_name}?`)) {
                        try {
                          await leaveGroup(currentUserId, selectedGroup.id);
                          setSelectedGroup(null);
                        } catch (err) {
                          alert("You cannot leave a room you created!");
                        }
                      }
                    }}
                    className={`${colors.textMuted} hover:text-rose-500 transition-colors`}
                    title="Leave Group"
                  >
                    <IconDoorExit className="w-4 h-4" />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
                
                {/* Channels Section */}
                <div>
                  <div
                    onClick={() => setActiveChannel('group')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      activeChannel === 'group' 
                        ? 'bg-[#15c3c6]/10 text-[#15c3c6]' 
                        : `${colors.textMuted} ${colors.bgHover} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-slate-800'}`
                    }`}
                  >
                    <IconHash className="w-5 h-5 opacity-70" />
                    <span className="font-semibold text-[15px] truncate {activeChannel === 'group' ? 'text-[#15c3c6]' : 'text-white'} ">General Updates</span>
                  </div>
                </div>

                {/* Direct Messages Section */}
                {(directChats[selectedGroup.id] || []).length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-bold text-[#8b92a5] uppercase tracking-[0.1em] mb-2 px-3">Direct Messages</h3>
                    <div className="space-y-[2px]">
                      {(directChats[selectedGroup.id] || []).map(dc => (
                        <div
                          key={dc.id}
                          onClick={() => setActiveChannel(dc.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                            activeChannel === dc.id 
                              ? 'bg-[#15c3c6]/10' 
                              : `${colors.bgHover}`
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getAvatarColor(dc.targetMemberId) }}>
                              {initials(dc.targetName)}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${theme === 'dark' ? 'border-[#1a1c23]' : 'border-[#f8fafc]'}`}></span>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className={`text-[15px] font-medium truncate ${activeChannel === dc.id ? 'text-[#15c3c6]' : 'text-[#e2e8f0]'}`}>
                              {dc.targetName}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members Section */}
                <div>
                  <h3 className="text-[11px] font-bold text-[#8b92a5] uppercase tracking-[0.1em] mb-2 px-3">Members</h3>
                  <div className="space-y-[2px]">
                    {selectedGroup.members?.map(m => (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between group px-3 py-2 rounded-xl transition-all cursor-pointer ${colors.bgHover}`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ backgroundColor: getAvatarColor(m.id) }}>
                              {initials(m.name)}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 ${theme === 'dark' ? 'border-[#1a1c23]' : 'border-[#f8fafc]'}`}></span>
                          </div>
                          <span className={`truncate text-[14px] font-medium ${colors.textMain} group-hover:text-white`}>{m.name}</span>
                        </div>
                        {m.id !== currentUserId && (
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleInitiateDirectChat(m.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-[#15c3c6] transition-opacity"
                            title="Message"
                          >
                            <IconMessageCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Profile Footer */}
              <div className={`p-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-[#13141a]' : 'bg-slate-200'} mt-auto border-t ${theme === 'dark' ? 'border-[#1a1c23]' : 'border-slate-300'}`}>
                <div className="w-10 h-10 rounded-full bg-[#2a2d35] shadow-sm flex items-center justify-center text-white font-bold">
                  {initials(currentUserName)}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[14px] font-bold ${colors.textMain} leading-tight`}>{currentUserName}</span>
                  <span className="text-[12px] text-[#15c3c6]">Online</span>
                </div>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <IconUsers className={`w-12 h-12 mb-4 ${colors.textMuted}`} />
                <p className={`text-sm ${colors.textMuted}`}>Select a group</p>
             </div>
          )}
        </aside>

        {/* PANE 3: MAIN CHAT AREA */}
        <main className={`flex-1 flex flex-col min-w-0 ${colors.bgPaneRight} relative`}>
          {selectedGroup ? (
            <>
              {/* Chat Header */}
              <header className={`h-[68px] flex justify-between items-center px-8 border-b ${theme === 'dark' ? 'border-[#1a1c23]' : 'border-slate-200'} flex-shrink-0`}>
                <div className="flex items-center gap-4">
                  <h3 className={`font-bold text-lg ${colors.accent}`}>MESSAGES</h3>
                  <div className={`text-[13px] ${colors.textMuted} flex items-center gap-2`}>
                     <span className="w-1.5 h-1.5 rounded-full bg-[#15c3c6]"></span>
                     {activeChannel === 'group' ? selectedGroup.room_name : (directChats[selectedGroup.id] || []).find(c => c.id === activeChannel)?.targetName}
                  </div>
                </div>
              </header>

              {/* Messages List */}
              <div ref={chatBodyRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scroll-smooth">
                {currentMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#2a2d35] rounded-full flex items-center justify-center mb-4">
                       <IconMessageCircle className={`w-8 h-8 ${colors.textMuted}`} />
                    </div>
                    <h3 className={`text-lg font-medium text-white mb-1`}>No messages yet</h3>
                    <p className={`text-sm ${colors.textMuted}`}>Send a message to start the conversation.</p>
                  </div>
                )}
                
                {currentMessages.map((msg, index) => {
                  const isMine = msg.senderId === currentUserId;
                  const showAvatar = index === 0 || currentMessages[index - 1].senderId !== msg.senderId;
                  const showTime = index === 0 || (new Date(msg.timestamp).getTime() - new Date(currentMessages[index - 1].timestamp).getTime() > 300000);

                  return (
                    <div key={msg.id} className={`flex gap-3 max-w-3xl ${isMine ? 'ml-auto flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      {showAvatar ? (
                        <div
                          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[12px] font-bold mt-0.5"
                          style={{ backgroundColor: getAvatarColor(msg.senderId) }}
                        >
                          {initials(msg.sender)}
                        </div>
                      ) : (
                        <div className="w-10 flex-shrink-0"></div>
                      )}
                      
                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        {/* Name and Time */}
                        {(showAvatar || showTime) && (
                          <div className={`flex items-baseline gap-2 mb-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                            <span className={`font-semibold text-[13px] ${isMine ? colors.accent : 'text-[#e2e8f0]'}`}>
                              {isMine ? 'You' : msg.sender}
                            </span>
                            <span className="text-[11px] text-[#64748b]">{formatTime(msg.timestamp)}</span>
                          </div>
                        )}
                        
                        {/* Message Bubble */}
                        <div
                          className={`px-5 py-3 rounded-[20px] text-[15px] leading-relaxed max-w-full break-words shadow-sm ${
                            isMine
                              ? `${colors.bubbleSend} rounded-tr-sm`
                              : `${colors.bubbleRecv} rounded-tl-sm`
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Area */}
              <div className="px-8 pb-8 pt-2 relative z-20">
                {showEmojiPicker && (
                  <div className="absolute bottom-20 left-8 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[#2a2d35]">
                    <EmojiPicker 
                      onEmojiClick={(e) => setNewMessage(prev => prev + e.emoji)} 
                      theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT} 
                    />
                  </div>
                )}
                <div className={`relative flex items-center ${colors.inputBg} rounded-full px-2 py-2 shadow-sm`}>
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                    className={`p-2.5 ${showEmojiPicker ? 'text-[#15c3c6]' : colors.textMuted} hover:text-[#15c3c6] transition-colors`}
                  >
                    <IconMoodSmile className="w-6 h-6" />
                  </button>
                  <button className={`p-2.5 ${colors.textMuted} hover:text-[#15c3c6] transition-colors mr-2`}>
                    <IconPhoto className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Send a message..."
                    className={`flex-1 bg-transparent border-none outline-none ${colors.textMain} placeholder-[#64748b] text-[15px]`}
                    disabled={isSending}
                    onFocus={() => setShowEmojiPicker(false)}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isSending}
                    className={`w-[44px] h-[44px] rounded-full ${colors.bgAccent} flex items-center justify-center text-[#0f1115] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-2 flex-shrink-0`}
                  >
                    <IconSend className="w-5 h-5 ml-[-2px]" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-24 h-24 mb-6 text-[#15c3c6] flex items-center justify-center rounded-full bg-[#15c3c6]/10">
                 <IconMessageCircle className="w-12 h-12" />
              </div>
              <h2 className={`text-2xl font-bold text-white mb-2`}>It's quiet in here</h2>
              <p className={colors.textMuted}>Select a group and start sending ripples!</p>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${colors.bgPaneMid} w-full max-w-md rounded-2xl p-7 shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold ${colors.textMain}`}>Create Group</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${colors.textMuted} ${colors.bgHover} transition-colors`}
               >
                ✕
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className={`block text-[12px] font-bold ${colors.textMuted} mb-2 uppercase tracking-wide`}>Group Name</label>
                <input
                  autoFocus
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  placeholder="e.g. Code Bros"
                  className={`w-full ${colors.inputBg} border-none rounded-xl px-4 py-3.5 ${colors.textMain} focus:outline-none focus:ring-2 focus:ring-[#15c3c6] transition-all`}
                />
              </div>
              
              <div>
                <label className={`block text-[12px] font-bold ${colors.textMuted} mb-2 uppercase tracking-wide`}>Max Members (Optional)</label>
                <input
                  type="number"
                  min="0"
                  value={maxCapacity}
                  onChange={e => setMaxCapacity(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="Leave empty for unlimited"
                  className={`w-full ${colors.inputBg} border-none rounded-xl px-4 py-3.5 ${colors.textMain} focus:outline-none focus:ring-2 focus:ring-[#15c3c6] transition-all`}
                />
              </div>
            </div>

            <button
              onClick={async () => {
                await createGroup(currentUserId, newRoomName, typeof maxCapacity === 'number' ? maxCapacity : 0);
                setShowCreateModal(false);
                setNewRoomName('');
                setMaxCapacity('');
              }}
              disabled={!newRoomName.trim()}
              className={`w-full mt-8 ${colors.bgAccent} text-[#0f1115] font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Create Group
            </button>
          </div>
        </div>
      )}

      {showDiscoverModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${colors.bgPaneMid} w-full max-w-md rounded-2xl p-7 shadow-2xl flex flex-col max-h-[80vh]`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h3 className={`text-xl font-bold ${colors.textMain}`}>Discover</h3>
              <button 
                onClick={() => setShowDiscoverModal(false)}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${colors.textMuted} ${colors.bgHover} transition-colors`}
               >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
              {groups.filter(g => !g.isMember).map(g => {
                const memCount = g.members?.length || 0;
                const isFull = g.max_capacity ? memCount >= g.max_capacity : false;

                return (
                  <div key={g.id} className={`flex items-center p-3.5 ${colors.inputBg} rounded-xl transition-colors`}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#0f1115] font-bold text-lg flex-shrink-0 shadow-sm" style={{ backgroundColor: getAvatarColor(g.id) }}>
                      {initials(g.room_name)}
                    </div>
                    <div className="flex-1 ml-4 overflow-hidden">
                      <div className={`font-bold text-[15px] ${colors.textMain} truncate`}>{g.room_name}</div>
                      <div className={`text-[12px] mt-0.5 ${isFull ? 'text-rose-500' : colors.textMuted}`}>
                        {memCount} / {g.max_capacity || 'Unlimited'} members {isFull && '(Full)'}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (isFull) return;
                        await joinGroup(currentUserId, g.id);
                        window.location.reload();
                      }}
                      disabled={isFull}
                      className={`ml-3 px-5 py-2.5 rounded-lg font-bold text-[13px] transition-all ${
                        isFull 
                          ? 'bg-[#1a1c23] text-[#64748b] cursor-not-allowed' 
                          : `${colors.bgAccent} text-[#0f1115] hover:opacity-90`
                      }`}
                    >
                      Join
                    </button>
                  </div>
                )
              })}
              {groups.filter(g => !g.isMember).length === 0 && (
                <div className={`text-center py-12 flex flex-col items-center ${colors.textMuted}`}>
                  <IconCompass className="w-12 h-12 mb-3 opacity-50" />
                  <p>No new groups found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};