import { getIO } from "../socket/index.js";

export const attachIO = async (req, res, next) => {
  req.io = getIO();
  next();
}
