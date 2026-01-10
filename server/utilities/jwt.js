import jwt from 'jsonwebtoken';

export const generateToken = (email) => {
  return jwt.sign(
    {email},
    process.env.JWT_SECRET,
    {expiresIn: "7d"}
  )
};
