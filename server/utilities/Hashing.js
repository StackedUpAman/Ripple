import bcrypt from "bcrypt";
import fs from "fs";
export async function generateAnionKey(email, password) {
  const hashedPassword = await bcrypt.hash(email + password, 10);

  const timestamp = new Date().toISOString();

  const data = `Hash: ${hashedPassword}\nDate: ${timestamp}\n\n`;

  fs.appendFile("./helper/anions.txt", data, (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return;
    }
    console.log("Stored successfully");
  });

  return hashedPassword;
}

// generateAnionKey("amannagpalji20@gmail.com","aman@123");

export async function generatePrivateKey(password, email, salt) {
  const hashedPassword = await bcrypt.hash(email + password, salt);

  const timestamp = new Date().toISOString();

  const data = `Hash: ${hashedPassword}\nDate: ${timestamp}\n\n`;

  fs.appendFile("./helper/private_key.txt", data, (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return;
    }
    console.log("Stored successfully");
  });

  return hashedPassword;
}
