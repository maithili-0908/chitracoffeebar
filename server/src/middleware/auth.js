import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      const error = new Error("Authorization token required");
      error.status = 401;
      throw error;
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-only-secret");
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      const error = new Error("User not found");
      error.status = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    error.status = error.status || 401;
    next(error);
  }
}

export function allowRoles(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error("You do not have permission for this action");
      error.status = 403;
      return next(error);
    }

    next();
  };
}
