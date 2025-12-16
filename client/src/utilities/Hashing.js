import bcrypt from "bcryptjs";

export async function generatePrivateKey(password, email, salt) {
  const hashedPassword = await bcrypt.hash(email + password, salt);
  return hashedPassword;
}
