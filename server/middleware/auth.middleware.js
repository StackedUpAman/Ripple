import jwt from 'jsonwebtoken';

export const verifyJWT = async (req, res, next) => {
  const token = await req.cookies?.auth_token;

  if(!token){
    return res
    .status(401)
    .json({message: "Not authenticated"});
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    return res
    .status(401)
    .json({message: "Invalid Token"});
  }
}
