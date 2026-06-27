import jwt from "jsonwebtoken";

export function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email
    },
    process.env.JWT_SECRET || "dev-only-secret",
    { expiresIn: "7d" }
  );
}
