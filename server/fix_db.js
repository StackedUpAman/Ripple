import sql from './db/postgres.js';

async function main() {
  try {
     console.log('Adding max_capacity to group_chat_room...');
     
     await sql`
       ALTER TABLE group_chat_room
       ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 0;
     `;

     console.log('Database fixed successfully!');
     process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
