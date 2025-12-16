import bcrypt from "bcrypt";
import fs from "fs";

export async function generateAnionKey(email, password) {
  const hashedPassword = await bcrypt.hash(email + password, 10);
  return hashedPassword;
}
