import User from "../models/User.js";

export async function getWorkers(_req, res, next) {
  try {
    const workers = await User.find({ role: "worker" }).select("-password").sort({ createdAt: -1 });
    res.json(workers);
  } catch (error) {
    next(error);
  }
}

export async function getUsers(_req, res, next) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        const error = new Error("Email already exists");
        error.status = 409;
        throw error;
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      const error = new Error("You cannot delete your own account");
      error.status = 400;
      throw error;
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
}
