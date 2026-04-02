import { Router } from "express";
import { createGroupChatRoom, getActiveRooms, joinGroupChatRoom, leaveGroupChatRoom } from "../controller/group_chat.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getGroupChatMessages, sendGroupMessage } from "../controller/group_chat_messages.js";
import { verifyRoomMember } from "../middleware/groupchat.middleware.js";
import { pairDirectChat, leaveDirectChat, getDirectChats } from "../controller/direct_chat.controller.js";
import { sendDirectMessage, getDirectChatMessages } from "../controller/direct_chat_messages.js";
import { campusOnly } from "../middleware/campusOnly.middleware.js";


const router = Router();

// router.use(campusOnly);

// GROUP CHAT ENDPOINTS
router.post('/group/create/:id', verifyJWT, createGroupChatRoom);
router.post('/group/join/:id/:roomId', verifyJWT, joinGroupChatRoom);
router.post('/group/leave/:id/:roomId', verifyJWT, leaveGroupChatRoom);
router.get('/group/active/:id', verifyJWT, getActiveRooms);
router.post('/group/:id/:roomId/sendmessage', verifyJWT, verifyRoomMember, sendGroupMessage);
router.get('/group/:id/:roomId/getmessages', verifyJWT, verifyRoomMember, getGroupChatMessages);

// DIRECT CHAT ENDPOINTS 
router.post('/direct/pair/:id', verifyJWT, pairDirectChat);
router.post('/direct/leave/:id', verifyJWT, leaveDirectChat);
router.get('/direct/chats/:id/:groupId', verifyJWT, getDirectChats);

// Direct Messages
router.post('/direct/:id/:groupId/:chatId/sendmessage', verifyJWT, sendDirectMessage);
router.get('/direct/:id/:groupId/:chatId/getmessages', verifyJWT, getDirectChatMessages);

export default router;