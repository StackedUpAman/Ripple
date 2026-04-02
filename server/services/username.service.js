import sql from "../db/postgres.js";

export const generateUsername = async () => {
  const [userRow] = await sql`
  SELECT * FROM usernames
  WHERE in_use = FALSE
  ORDER BY RANDOM()
  LIMIT 1;
  `

  if (!userRow) {
    // Fallback if the usernames table is empty or exhausted
    return "user_" + Math.random().toString(36).substring(2, 8);
  }

  await sql`
  UPDATE usernames
  SET in_use = ${true}, assigned_at = ${Date.now()}
  WHERE id = ${userRow.id}
  `

  return userRow.username;
}

export const removeUsername = async (username) => {  
  await sql`
    UPDATE usernames
    SET in_use = ${false}
    WHERE username = ${username}
  `

  return;
}
