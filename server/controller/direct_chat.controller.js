import sql from '../db/postgres.js';
import { generateMemberId, generateAnonName } from "../utilities/crypto.js";

// Initiates or fetches a 1-on-1 chat with another anonymous group member
export const pairDirectChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupId, targetMemberId } = req.body;

    const [user] = await sql`
        SELECT private_key FROM users
        WHERE id = ${id}
    `;

    if (!user) return res.status(404).json({ message: "User not found" });

    const myMemberId = generateMemberId(groupId, user.private_key);

    if (myMemberId === targetMemberId) {
      return res.status(400).json({ message: "Cannot chat with yourself." });
    }

    // Verify both are members of the group
    const members = await sql`
      SELECT member_id FROM group_chat_members
      WHERE chat_room_id = ${groupId} AND member_id IN (${myMemberId}, ${targetMemberId})
    `;

    if (members.length !== 2) {
      return res.status(403).json({ message: "Both users must be members of the group." });
    }

    // Ensure predictable Ordering for Unique Constraint
    const member1_id = myMemberId < targetMemberId ? myMemberId : targetMemberId;
    const member2_id = myMemberId < targetMemberId ? targetMemberId : myMemberId;

    const [room] = await sql`
        INSERT INTO group_direct_chats (group_id, member1_id, member2_id)
        VALUES (${groupId}, ${member1_id}, ${member2_id})
        ON CONFLICT (group_id, member1_id, member2_id) DO UPDATE SET group_id = EXCLUDED.group_id
        RETURNING *
    `;

    // Notify target member over socket if needed (target member identifier is anonymous, so room payload is enough)
    req.io.emit(`direct_room:created:${groupId}`, room);

    return res.status(200).json({
      roomId: room.id,
      chat: room
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong while pairing." });
  }
}

// Fetch all 1-on-1 chats for the user in a given group
export const getDirectChats = async (req, res) => {
  try {
    const { id, groupId } = req.params;

    const [user] = await sql`
        SELECT private_key FROM users
        WHERE id = ${id}
    `;

    if (!user) return res.status(404).json({ message: "User not found" });

    const myMemberId = generateMemberId(groupId, user.private_key);

    const chats = await sql`
        SELECT * FROM group_direct_chats
        WHERE group_id = ${groupId} AND (member1_id = ${myMemberId} OR member2_id = ${myMemberId})
    `;


    // Augment with friendly anonymous target name
    const augmentedChats = chats.map(chat => {
      const targetMemberId = chat.member1_id === myMemberId ? chat.member2_id : chat.member1_id;
      return {
        ...chat,
        targetMemberId,
        targetName: generateAnonName(targetMemberId)
      }
    });

    return res.status(200).json({
      chats: augmentedChats
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to load chats." });
  }
}

export const leaveDirectChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { chatId } = req.body;

    return res.status(200).json({ message: "Leaving specific 1v1 history is handled via frontend closing." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong while leaving chat" });
  }
};