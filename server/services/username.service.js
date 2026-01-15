import sql from "../db/postgres.js";

export const generateUsername = async () => {
  const [username] = await sql`
  SELECT * FROM usernames
  WHERE in_use = FALSE
  ORDER BY RANDOM()
  LIMIT 1;
  `

  await sql`
  UPDATE usernames
  SET in_use = ${true}, assigned_at = ${Date.now()}
  WHERE id = ${username.id}
  `

  return username;
}

export const removeUsername = async (username) => {  
  await sql`
    UPDATE usernames
    SET in_use = ${false}
    WHERE username = ${username}
  `

  return;
}
