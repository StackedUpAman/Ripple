import sql from "../db/postgres.js";
import { generateMemberId, generateAnonName } from "../utilities/crypto.js";

export const createGroupChatRoom = async (req ,res) => {
  try {
    const {id} = req.params;    
    const {room_name, max_capacity} = req.body;

    const [user] = await sql`
      SELECT private_key FROM users
      WHERE id = ${id}
    `
    
    if(!room_name){
        return res
        .status(400)
        .json({message: "Room Name must be provided"});
    }

   const ends_at = Date.now() + (2 * 3600 * 1000);

   const chat_room = await sql`
    INSERT INTO group_chat_room(room_name, owner_id, ends_at, max_capacity)
    VALUES (${room_name},${id}, ${ends_at}, ${max_capacity ? parseInt(max_capacity) : 0})
    RETURNING *
  `;

  const roomId = chat_room[0].id;
  const member_id = generateMemberId(roomId, user.private_key);
  const anon_name = generateAnonName(member_id);

    await sql`
    INSERT INTO group_chat_members(chat_room_id, member_id, anon_name)
    VALUES (${roomId}, ${member_id}, ${anon_name}) 
    RETURNING *
  `;

  const roomWithMembers = {
      ...chat_room[0],
      members: [{id: member_id, name: anon_name}]
  };

  req.io.emit('room:created', [roomWithMembers]);
  console.log("Room created", roomWithMembers);

  return res
  .status(201)
  .json({
    chat_room: [roomWithMembers],
    message: "Chat room created successfully"
  });
  } catch (error) {

    console.log(error);
    return res
    .status(500)
    .json({message: "Something went wrong"})
  };
}

export const joinGroupChatRoom = async (req, res) => {
  try {
    const { id, roomId } = req.params;

    const [user] = await sql`
      SELECT private_key FROM users
      WHERE id = ${id}
    `

    const member_id = generateMemberId(roomId, user.private_key);
    const anon_name = generateAnonName(member_id);
    const member = {id: member_id, name: anon_name};

    const room = await sql`
      SELECT id, ends_at, max_capacity
      FROM group_chat_room
      WHERE id = ${roomId}
    `;

    if (room.length === 0) {
      return res
        .status(404)
        .json({ message: "Chat room not found" });
    }

    if (room[0].ends_at < Date.now()) {
      return res
        .status(410)
        .json({ message: "Chat room has expired" });
    }

    if (room[0].max_capacity && room[0].max_capacity > 0) {
       const [memCountObj] = await sql`SELECT COUNT(*) FROM group_chat_members WHERE chat_room_id = ${roomId}`;
       const currentMembers = parseInt(memCountObj.count, 10);
       if (currentMembers >= room[0].max_capacity) {
           return res.status(403).json({ message: "This room has reached its maximum capacity." });
       }
    }

    const existingMember = await sql`
      SELECT 1
      FROM group_chat_members
      WHERE chat_room_id = ${roomId}
      AND member_id = ${member_id}
    `;

    if (existingMember.length > 0) {
      return res
        .status(409)
        .json({ message: "User already a member of this room" });
    }

    await sql`
      INSERT INTO group_chat_members(chat_room_id, member_id, anon_name)
      VALUES (${roomId}, ${member_id}, ${anon_name})
    `;

     req.io.emit('room:member:joined', {roomId, member});
     
     return res
     .status(200)
     .json({ message: "Joined chat room successfully", member });

  } catch (error) {
    return res
    .status(500)
      .json({ message: "Something went wrong" });
  }
};

export const leaveGroupChatRoom = async (req, res) => {
  try {
    const { id, roomId } = req.params;

    const [user] = await sql`
      SELECT private_key FROM users
      WHERE id = ${id}
    `
    const member_id = generateMemberId(roomId, user.private_key);

    const membership = await sql`
      SELECT g.owner_id
      FROM group_chat_members m
      JOIN group_chat_room g
      ON g.id = m.chat_room_id
      WHERE m.chat_room_id = ${roomId}
      AND m.member_id = ${member_id}
    `;
      
    if (membership.length === 0) {
      return res
        .status(404)
        .json({ message: "User is not a member of this room" });
    }

    if (membership[0].owner_id === id) {
      return res
        .status(403)
        .json({ message: "Room owner cannot leave the group" });
    }

    await sql`
      DELETE FROM group_chat_members
      WHERE chat_room_id = ${roomId}
      AND member_id = ${member_id}
    `;
    
    // Member details needed for client removal:
    req.io.emit('room:member:left', {roomId, memberId: member_id});

    return res
      .status(200)
      .json({ message: "Left chat room successfully" });

  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Something went wrong" });
  }
};

export const getActiveRooms = async (req, res) => {
  const { id } = req.params; // Get requesting user ID
  const now = Date.now();

  try {
    const [user] = await sql`
        SELECT private_key FROM users WHERE id = ${id}
    `;

    if(!user) return res.status(404).json({message: "User not found"});

    const rooms = await sql`
      SELECT *
      FROM group_chat_room
      WHERE ends_at > ${now}
      ORDER BY ends_at ASC
    `;

    // Fetch members for each active room securely and determine membership
    for (let i = 0; i < rooms.length; i++) {
      const roomId = rooms[i].id;
      const myMemberId = generateMemberId(roomId, user.private_key);

      const members = await sql`
        SELECT member_id as id, anon_name as name
        FROM group_chat_members
        WHERE chat_room_id = ${roomId}
      `;
      rooms[i].members = members;
      rooms[i].isMember = members.some(m => m.id === myMemberId);
    }

    res.json({ rooms });
  } catch(error) {
    console.log(error);
    res.status(500).json({message: "Failed to fetch active rooms."});
  }
};
