import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../lib/jwt.js";

export async function register(req, res, next) {
  try {
    const { name, email, phone, password, confirmPassword, role } = req.body;

    if (!name || !email || !phone || !password || !confirmPassword || !role) {
      const error = new Error("All fields are mandatory");
      error.status = 400;
      throw error;
    }

    if (!["admin", "worker"].includes(role)) {
      const error = new Error("Please choose admin or worker");
      error.status = 400;
      throw error;
    }

    if (password !== confirmPassword) {
      const error = new Error("Passwords do not match");
      error.status = 400;
      throw error;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User exists already");
      error.status = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.status = 400;
      throw error;
    }

    const user = await User.findOne({ email });
    const validPassword = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !validPassword) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      const error = new Error("Email, password and confirm password are required");
      error.status = 400;
      throw error;
    }

    if (password !== confirmPassword) {
      const error = new Error("Passwords do not match");
      error.status = 400;
      throw error;
    }

    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("No account found with this email");
      error.status = 404;
      throw error;
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
}
