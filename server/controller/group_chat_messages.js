import sql from "../db/postgres.js";
import { generateAnonName } from "../utilities/crypto.js";

export const sendGroupMessage = async (req, res) => {
    const {roomId} = req.params;
    const {message} = req.body;
    
    // Extracted safely from verifyRoomMember middleware
    const member_id = req.memberId;
    const anon_name = generateAnonName(member_id);

    if(!message){
        return res
        .status(400)
        .json({message: "Blank message cannot be sent"})
    }

    try {
        const msg = await sql`
        INSERT INTO group_chat_messages(member_id, room_id, message)
        VALUES (${member_id}, ${roomId}, ${message})
        RETURNING *
    `;

    const Message = {
        id: msg[0].id,
        sender: anon_name,
        senderId: member_id,
        text: message,
        timestamp: msg[0].created_at,
        roomId: roomId
    }

    req.io.emit('message:received', Message);

    return res
    .status(201)
    .json({message: "Message delivered successfully"})
    } catch (error) {
        console.log(error);
        return res
        .status(500)
        .json({message: "Something went wrong while sending a message"})
    }
}

export const getGroupChatMessages = async (req, res) => {
    const {roomId} = req.params;

    const messages = await sql`
        SELECT 
           m.id, 
           m.message as text, 
           m.created_at as timestamp, 
           m.member_id as "senderId",
           m.room_id as "roomId"
        FROM group_chat_messages m
        WHERE room_id = ${roomId}
        ORDER BY created_at ASC
    `;
    
    // Map with anonymous names
    for(let msg of messages) {
       msg.sender = generateAnonName(msg.senderId);
    }

    return res
    .status(200)
    .json({
        messages,
        message: "Messages loaded successfully"
    });
}
