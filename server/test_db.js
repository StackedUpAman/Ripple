import sql from './db/postgres.js';

async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log("Database connection successful:", result);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    if(error.code) console.error("Error Code:", error.code);
  } finally {
    process.exit();
  }
}

testConnection();
