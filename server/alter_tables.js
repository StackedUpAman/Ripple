import sql from './db/postgres.js';

async function main() {
  try {
     console.log('Altering group_chat_members...');
     try { await sql`ALTER TABLE group_chat_members DROP CONSTRAINT IF EXISTS group_chat_members_user_id_fkey`; } catch(e){}
     await sql`ALTER TABLE group_chat_members ALTER COLUMN user_id TYPE TEXT`;
     await sql`ALTER TABLE group_chat_members RENAME COLUMN user_id TO member_id`;
     await sql`ALTER TABLE group_chat_members RENAME COLUMN user_name TO anon_name`;

     console.log('Altering group_chat_messages...');
     try { await sql`ALTER TABLE group_chat_messages DROP CONSTRAINT IF EXISTS group_chat_messages_user_id_fkey`; } catch(e){}
     await sql`ALTER TABLE group_chat_messages ALTER COLUMN user_id TYPE TEXT`;
     await sql`ALTER TABLE group_chat_messages RENAME COLUMN user_id TO member_id`;

     console.log('Tables altered successfully!');
     process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
