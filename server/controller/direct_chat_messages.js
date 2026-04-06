import sql from "../db/postgres.js";
import { generateMemberId, generateAnonName } from "../utilities/crypto.js";
import {redis} from "../utilities/redisClient.js";
export const sendDirectMessage = async (req, res) => {
    const { id, groupId, chatId } = req.params;
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ message: "Blank message cannot be sent" })
    }

    try {
        const [user] = await sql`SELECT private_key FROM users WHERE id = ${id}`;
        const member_id = generateMemberId(groupId, user.private_key);
        const anon_name = generateAnonName(member_id);

        // Verify chat belongs to this member
        const [chat] = await sql`
            SELECT id FROM group_direct_chats 
            WHERE id = ${chatId} AND (member1_id = ${member_id} OR member2_id = ${member_id})
        `;
        if (!chat) return res.status(403).json({ message: "Unauthorized to send to this chat" });

        const [msg] = await sql`
            INSERT INTO group_direct_messages(chat_id, author_id, text)
            VALUES (${chatId}, ${member_id}, ${message})
            RETURNING *
        `;

        const Message = {
            id: msg.id,
            sender: anon_name,
            senderId: member_id,
            text: message,
            timestamp: msg.timestamp,
            chatId: chatId,
            groupId: groupId
        }

        req.io.emit(`direct_message:received:${chatId}`, Message);

        


        //redis

        // 3. Fire and Forget to Redis Queue
        const queuePayload = JSON.stringify({
            id: msg.id,
            chatId:chatId,
            text: msg.text
        })

        // Push to a Redis list named 'moderation_queue'
        await redis.lpush('moderation_queue', queuePayload);

        console.log("sent to redis moderation queue")


        return res.status(201).json({ message: "Message delivered successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong while sending a message" })
    }
}

export const getDirectChatMessages = async (req, res) => {
    try {
        const { id, groupId, chatId } = req.params;

        const [user] = await sql`SELECT private_key FROM users WHERE id = ${id}`;
        const member_id = generateMemberId(groupId, user.private_key);

        const [chat] = await sql`
            SELECT id FROM group_direct_chats 
            WHERE id = ${chatId} AND (member1_id = ${member_id} OR member2_id = ${member_id})
        `;
        if (!chat) return res.status(403).json({ message: "Unauthorized to read this chat" });

        const messages = await sql`
            SELECT 
            m.id, 
            m.text, 
            m.timestamp, 
            m.is_toxic,
            m.author_id as "senderId",
            m.chat_id as "chatId"
            FROM group_direct_messages m
            WHERE chat_id = ${chatId}
            ORDER BY timestamp ASC
        `;

        for (let msg of messages) {
            msg.sender = generateAnonName(msg.senderId);
            if(msg.is_toxic){
                msg.text = "🚫 This message was removed for violating community guidelines.";
            }
        }

        return res.status(200).json({ messages, message: "Messages loaded" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong loading messages" })
    }
}