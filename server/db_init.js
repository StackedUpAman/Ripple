import sql from './db/postgres.js';

async function main() {
  try {
     console.log('Creating tables...');
     await sql`
       CREATE TABLE IF NOT EXISTS group_direct_chats (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         group_id UUID NOT NULL,
         member1_id TEXT NOT NULL,
         member2_id TEXT NOT NULL,
         created_at TIMESTAMP DEFAULT NOW(),
         UNIQUE(group_id, member1_id, member2_id)
       );
     `;
     
     await sql`
       CREATE TABLE IF NOT EXISTS group_direct_messages (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         chat_id UUID REFERENCES group_direct_chats(id) ON DELETE CASCADE,
         author_id TEXT NOT NULL,
         text TEXT NOT NULL,
         timestamp TIMESTAMP DEFAULT NOW()
       );
     `;
     console.log('Tables created successfully!');
     process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
