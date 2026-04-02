import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getSocket } from '../utilities/socket'; 

export type Group = {
  id: string;
  room_name: string;
  owner_id: string;
  ends_at: string | number;
  members?: Member[];
  isMember?: boolean;
  max_capacity?: number;
};

export type DirectChat = {
  id: string;
  group_id: string;
  targetMemberId: string;
  targetName: string;
};

export type Member = {
  id: string;
  name: string;
  isOnline?: boolean;
};

export type Message = {
  id: string;
  sender: string;
  senderId: string;
  text: string;
  timestamp: string;
  roomId?: string; // For groups
  chatId?: string; // For direct
};

const API_BASE = 'http://localhost:3000/groupchat'; // using the router mount

export const useRooms = (currentUserId: string) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [directChats, setDirectChats] = useState<Record<string, DirectChat[]>>({});
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active groups
  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE}/group/active/${currentUserId}`, { withCredentials: true });
      setGroups(res.data.rooms || []);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('room:created', (groupList: Group[]) => {
      setGroups((prev) => {
        if (prev.some((g) => g.id === groupList[0].id)) return prev;
        return [...prev, groupList[0]];
      });
    });

    socket.on('room:member:joined', ({ roomId, member }: { roomId: string; member: Member }) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === roomId) {
            const members = g.members || [];
            if (members.some((m) => m.id === member.id)) return g;
            return { ...g, members: [...members, member] };
          }
          return g;
        })
      );
    });

    socket.on('room:member:left', ({ roomId, memberId }: { roomId: string; memberId: string }) => {
       setGroups((prev) =>
         prev.map((g) => {
           if (g.id === roomId) {
             return { ...g, members: (g.members || []).filter((m) => m.id !== memberId) };
           }
           return g;
         })
       );
    });

    socket.on('message:received', (message: Message) => {
      const targetId = message.roomId || message.chatId || '';
      setMessages((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), message],
      }));
    });

    // Listen for new direct chats being created in any group
    // The event is emitted as `direct_room:created:${groupId}` but we might not have dynamic listeners easily 
    // unless we attach them per group. To keep it simple, we can re-fetch chats periodically or use wildcard, 
    // but the backend emits: req.io.emit(`direct_room:created:${groupId}`, room);
    
    return () => {
      socket.off('room:created');
      socket.off('room:member:joined');
      socket.off('room:member:left');
      socket.off('message:received');
    };
  }, []);

  const startDirectChatListener = useCallback((groupId: string) => {
     const socket = getSocket();
     if (!socket) return;
     const evt = `direct_room:created:${groupId}`;
     socket.off(evt); // clear previous to prevent duplicates
     socket.on(evt, (chat: any) => {
        // Simple heuristic: refetch direct chats for this group to get augmented names securely
        fetchDirectChats(currentUserId, groupId);
     });
     
     const msgEvt = `direct_message:received`;
     // We actually emit direct_message:received:${chatId} in backend, so we need to listen when a chat is opened.
  }, [currentUserId]);

  const startDirectMessageListener = useCallback((chatId: string) => {
     const socket = getSocket();
     if (!socket) return;
     const evt = `direct_message:received:${chatId}`;
     socket.off(evt);
     socket.on(evt, (message: Message) => {
       setMessages((prev) => ({
         ...prev,
         [chatId]: [...(prev[chatId] || []), message],
       }));
     });
  }, []);

  const fetchDirectChats = useCallback(async (userId: string, groupId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/direct/chats/${userId}/${groupId}`, { withCredentials: true });
      setDirectChats((prev) => ({ ...prev, [groupId]: res.data.chats || [] }));
      res.data.chats.forEach((c: DirectChat) => startDirectMessageListener(c.id));
      return res.data.chats;
    } catch (err) {
      console.error('Failed to fetch direct chats:', err);
      return [];
    }
  }, [startDirectMessageListener]);

  const fetchGroupMessages = useCallback(async (userId: string, groupId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/group/${userId}/${groupId}/getmessages`, { withCredentials: true });
      setMessages((prev) => ({ ...prev, [groupId]: res.data.messages || [] }));
      return res.data.messages;
    } catch (err) {
      console.error('Failed to fetch group messages:', err);
      return [];
    }
  }, []);

  const fetchDirectMessages = useCallback(async (userId: string, groupId: string, chatId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/direct/${userId}/${groupId}/${chatId}/getmessages`, { withCredentials: true });
      setMessages((prev) => ({ ...prev, [chatId]: res.data.messages || [] }));
      startDirectMessageListener(chatId);
      return res.data.messages;
    } catch (err) {
      console.error('Failed to fetch direct messages:', err);
      return [];
    }
  }, [startDirectMessageListener]);

  const createGroup = useCallback(async (userId: string, roomName: string, maxCapacity?: number) => {
    try {
      const res = await axios.post(`${API_BASE}/group/create/${userId}`, { room_name: roomName, max_capacity: maxCapacity }, { withCredentials: true });
      const newGroup = res.data.chat_room[0];
      setGroups(prev => [...prev, {...newGroup, isMember: true}]);
      return newGroup;
    } catch (err) {
      console.error('Failed to create group:', err);
      throw err;
    }
  }, []);

  const joinGroup = useCallback(async (userId: string, groupId: string) => {
    try {
      await axios.post(`${API_BASE}/group/join/${userId}/${groupId}`, {}, { withCredentials: true });
    } catch (err) {
      console.error('Failed to join group:', err);
      throw err;
    }
  }, []);

  const leaveGroup = useCallback(async (userId: string, groupId: string) => {
    try {
      await axios.post(`${API_BASE}/group/leave/${userId}/${groupId}`, {}, { withCredentials: true });
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isMember: false } : g));
    } catch (err) {
      console.error('Failed to leave group:', err);
      throw err;
    }
  }, []);

  const pairDirectChat = useCallback(async (userId: string, groupId: string, targetMemberId: string) => {
    try {
      const res = await axios.post(`${API_BASE}/direct/pair/${userId}`, { groupId, targetMemberId }, { withCredentials: true });
      await fetchDirectChats(userId, groupId);
      return res.data.chat;
    } catch (err) {
      console.error('Failed to pair direct chat:', err);
      throw err;
    }
  }, [fetchDirectChats]);

  const sendGroupMessage = useCallback(async (userId: string, groupId: string, text: string) => {
    try {
      await axios.post(`${API_BASE}/group/${userId}/${groupId}/sendmessage`, { message: text }, { withCredentials: true });
    } catch (err) {
      console.error('Failed to send group message:', err);
      throw err;
    }
  }, []);

  const sendDirectMessage = useCallback(async (userId: string, groupId: string, chatId: string, text: string) => {
    try {
      await axios.post(`${API_BASE}/direct/${userId}/${groupId}/${chatId}/sendmessage`, { message: text }, { withCredentials: true });
    } catch (err) {
      console.error('Failed to send direct message:', err);
      throw err;
    }
  }, []);

  return {
    groups,
    directChats,
    messages,
    isLoading,
    error,
    fetchGroups,
    fetchDirectChats,
    fetchGroupMessages,
    fetchDirectMessages,
    createGroup,
    joinGroup,
    leaveGroup,
    pairDirectChat,
    sendGroupMessage,
    sendDirectMessage,
    startDirectChatListener
  };
};