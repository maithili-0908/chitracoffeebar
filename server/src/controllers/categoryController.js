import Category from "../models/Category.js";

export async function getCategories(_req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name } = req.body;

    if (!name) {
      const error = new Error("Category name is required");
      error.status = 400;
      throw error;
    }

    const exists = await Category.findOne({ name: new RegExp(`^${name.trim()}$`, "i") });
    if (exists) {
      const error = new Error("Category already exists");
      error.status = 409;
      throw error;
    }

    const category = await Category.create({ name, createdBy: req.user._id });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true, runValidators: true }
    );

    if (!category) {
      const error = new Error("Category not found");
      error.status = 404;
      throw error;
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      const error = new Error("Category not found");
      error.status = 404;
      throw error;
    }

    res.json({ message: "Category deleted" });
  } catch (error) {
    next(error);
  }
}
