import Item from "../models/Item.js";
import StockLog from "../models/StockLog.js";

function normalizeItemInput(body) {
  const totalQuantity = Number(body.totalQuantity || 0);
  const sold = Number(body.sold || 0);
  const purchasePrice = Number(body.purchasePrice || 0);
  const sellingPrice = Number(body.sellingPrice || body.price || 0);

  return {
    category: body.category,
    itemName: body.itemName,
    price: sellingPrice,
    totalQuantity,
    sold,
    balance: Math.max(totalQuantity - sold, 0),
    purchasePrice,
    sellingPrice,
    date: body.date || new Date(),
    profitAmount: (sellingPrice - purchasePrice) * sold
  };
}

function getTodayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function validateItemQuantities(body) {
  const totalQuantity = Number(body.totalQuantity || 0);
  const sold = Number(body.sold || 0);

  if (sold > totalQuantity) {
    const error = new Error("Sold quantity cannot be greater than total quantity");
    error.status = 400;
    throw error;
  }
}

export async function getItems(req, res, next) {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    const items = await Item.find(filter).populate("category").sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function createItem(req, res, next) {
  try {
    const required = ["category", "itemName", "purchasePrice", "sellingPrice"];
    const missing = required.find((field) => req.body[field] === undefined || req.body[field] === "");

    if (missing) {
      const error = new Error("Please select a category and fill all item details");
      error.status = 400;
      throw error;
    }

    const existingItem = await Item.findOne({
      itemName: new RegExp(`^${req.body.itemName.trim()}$`, "i")
    });

    if (existingItem) {
      const error = new Error("Item already added");
      error.status = 409;
      throw error;
    }

    validateItemQuantities({ ...req.body, totalQuantity: req.body.totalQuantity || 0, sold: req.body.sold || 0 });

    const item = await Item.create({
      ...normalizeItemInput(req.body),
      createdBy: req.user._id
    });

    const populatedItem = await item.populate("category");
    res.status(201).json(populatedItem);
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      const error = new Error("Item not found");
      error.status = 404;
      throw error;
    }

    const duplicate = await Item.findOne({
      _id: { $ne: item._id },
      itemName: new RegExp(`^${(req.body.itemName || item.itemName).trim()}$`, "i")
    });

    if (duplicate) {
      const error = new Error("Item already added");
      error.status = 409;
      throw error;
    }

    validateItemQuantities({ ...item.toObject(), ...req.body });
    Object.assign(item, normalizeItemInput({ ...item.toObject(), ...req.body }));
    await item.save();
    await item.populate("category");
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function updateDailyStock(req, res, next) {
  try {
    const { date, quantity, sold } = req.body;
    const today = getTodayKey();

    if (!date || date !== today) {
      const error = new Error("Date is mandatory and must be today");
      error.status = 400;
      throw error;
    }

    const nextQuantity = Number(quantity);
    const nextSold = Number(sold || 0);
    if (Number.isNaN(nextQuantity) || nextQuantity < 0) {
      const error = new Error("Quantity must be zero or more");
      error.status = 400;
      throw error;
    }

    if (Number.isNaN(nextSold) || nextSold < 0) {
      const error = new Error("Sold quantity must be zero or more");
      error.status = 400;
      throw error;
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      const error = new Error("Item not found");
      error.status = 404;
      throw error;
    }

    if (nextQuantity < nextSold) {
      const error = new Error("Quantity cannot be less than sold quantity");
      error.status = 400;
      throw error;
    }

    item.totalQuantity = nextQuantity;
    item.sold = nextSold;
    item.balance = Math.max(nextQuantity - nextSold, 0);
    item.date = new Date(`${today}T00:00:00.000Z`);
    item.profitAmount = (item.sellingPrice - item.purchasePrice) * nextSold;
    await item.save();
    await item.populate("category");

    await StockLog.findOneAndUpdate(
      { item: item._id, date: today },
      {
        item: item._id,
        date: today,
        totalQuantity: item.totalQuantity,
        sold: item.sold,
        balance: item.balance,
        profitAmount: item.profitAmount,
        updatedBy: req.user?._id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function getStockByDate(req, res, next) {
  try {
    const date = req.query.date || getTodayKey();
    const items = await Item.find().populate("category").sort({ createdAt: -1 });
    const logs = await StockLog.find({ date });
    const logMap = new Map(logs.map((log) => [String(log.item), log]));

    const stock = items.map((item) => {
      const log = logMap.get(String(item._id));
      const isCurrentItemDate = item.date && new Date(item.date).toISOString().slice(0, 10) === date;

      return {
        _id: log?._id || `${item._id}-${date}`,
        item: item._id,
        itemName: item.itemName,
        category: item.category,
        sellingPrice: item.sellingPrice,
        purchasePrice: item.purchasePrice,
        date,
        totalQuantity: log ? log.totalQuantity : isCurrentItemDate ? item.totalQuantity : 0,
        sold: log ? log.sold : isCurrentItemDate ? item.sold : 0,
        balance: log ? log.balance : isCurrentItemDate ? item.balance : 0,
        profitAmount: log ? log.profitAmount : isCurrentItemDate ? item.profitAmount : 0
      };
    });

    res.json(stock);
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      const error = new Error("Item not found");
      error.status = 404;
      throw error;
    }

    res.json({ message: "Item deleted" });
  } catch (error) {
    next(error);
  }
}
