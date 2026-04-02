import sql from '../db/postgres.js'
import { getIO } from '../socket/index.js';

export const startRoomExpiryJob = () => {
  console.log('Room expiry job started');

  setInterval(async () => {
    try {
      const now = Date.now();

      const expiredRooms = await sql`
        SELECT id
        FROM group_chat_room
        WHERE ends_at <= ${now}
      `;

      if (expiredRooms.length === 0) return;

      console.log('Deleting expired rooms:', expiredRooms.length);

      await sql`
        DELETE FROM group_chat_room
        WHERE ends_at <= ${now}
      `;

    } catch (err) {
      console.error('Room expiry job error:', err);
    }
  }, 60_000);
};
