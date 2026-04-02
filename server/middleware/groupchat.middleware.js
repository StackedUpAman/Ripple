import sql from "../db/postgres.js";
import { generateMemberId } from "../utilities/crypto.js";

export const verifyRoomMember = async (req, res, next) => {
  const {id, roomId} = req.params;

  const [user] = await sql`
    SELECT private_key FROM users
    WHERE id = ${id}
  `;

  const [room] = await sql`
    SELECT id FROM group_chat_room
    WHERE id = ${roomId}
  `;

  if(!user || !room) {
      return res
      .status(400)
      .json({message: "Invalid id or roomId"})
  }

  const member_id = generateMemberId(roomId, user.private_key);

  try {
      const isMember = await sql`
          SELECT id FROM group_chat_members
          WHERE chat_room_id = ${roomId} AND member_id = ${member_id}
      `

      if(isMember.length === 0){
          return res
          .status(401)
          .json({message: "You are not a member of this room"})
      }

      req.memberId = member_id; // Pass this along to save re-hashing
      next();
  } catch (error) {
      console.log(error);
      return res
      .status(500)
      .json({message: "Something went wrong while verifying the room member"})
  }
}