import Item from "../models/Item.js";
import Sale from "../models/Sale.js";
import StockLog from "../models/StockLog.js";

function getTodayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export async function createSale(req, res, next) {
  try {
    const { items = [], discount = 0, paymentMethod = "cash", billAmount = 0, amountReceived = 0 } = req.body;

    if (!items.length) {
      const error = new Error("Cart is empty");
      error.status = 400;
      throw error;
    }

    const saleLines = [];
    let subtotal = 0;
    let profit = 0;
    const checkedItems = [];
    const today = getTodayKey();

    for (const line of items) {
      const item = await Item.findById(line.item).populate("category");
      const quantity = Number(line.quantity);

      if (!item) {
        const error = new Error("Item not found");
        error.status = 404;
        throw error;
      }

      const itemDate = item.date ? new Date(item.date).toISOString().slice(0, 10) : "";
      if (itemDate !== today) {
        const error = new Error(`Update today's quantity for ${item.itemName} before billing`);
        error.status = 400;
        throw error;
      }

      if (quantity > item.balance) {
        const error = new Error(`Available quantity ${item.balance} for ${item.itemName}`);
        error.status = 400;
        throw error;
      }

      checkedItems.push({ item, quantity });
      subtotal += item.sellingPrice * quantity;
    }

    const safeDiscount = Math.min(Number(discount || 0), subtotal);
    const discountPerLine = checkedItems.length ? safeDiscount / checkedItems.length : 0;
    const totalAmount = subtotal - safeDiscount;
    const paidAmount = paymentMethod === "upi" ? totalAmount : Number(amountReceived || 0);

    if (!["cash", "upi"].includes(paymentMethod)) {
      const error = new Error("Choose cash or UPI payment");
      error.status = 400;
      throw error;
    }

    if (paymentMethod === "cash" && paidAmount < totalAmount) {
      const error = new Error("Amount received cannot be less than bill amount");
      error.status = 400;
      throw error;
    }

    for (const { item, quantity } of checkedItems) {
      const totalPrice = item.sellingPrice * quantity;
      const lineProfit = (item.sellingPrice - item.purchasePrice) * quantity - discountPerLine;

      item.sold += quantity;
      item.balance = Math.max(item.totalQuantity - item.sold, 0);
      item.profitAmount = (item.sellingPrice - item.purchasePrice) * item.sold;
      await item.save();

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

      profit += lineProfit;
      saleLines.push({
        item: item._id,
        itemName: item.itemName,
        categoryName: item.category?.name || "Others",
        quantity,
        unitPrice: item.sellingPrice,
        totalPrice: Math.max(totalPrice - discountPerLine, 0),
        profit: lineProfit
      });
    }

    const sale = await Sale.create({
      items: saleLines,
      subtotal,
      discount: safeDiscount,
      totalAmount,
      profit,
      paymentMethod,
      billAmount: paymentMethod === "cash" ? Number(billAmount || totalAmount) : totalAmount,
      amountReceived: paidAmount,
      balanceReturned: Math.max(paidAmount - totalAmount, 0),
      worker: req.user?._id
    });

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
}

export async function getSales(req, res, next) {
  try {
    const filter = {};
    if (req.query.date) {
      filter.createdAt = {
        $gte: new Date(`${req.query.date}T00:00:00.000Z`),
        $lte: new Date(`${req.query.date}T23:59:59.999Z`)
      };
    }
    if (req.query.worker) filter.worker = req.query.worker;
    if (req.query.item) filter["items.itemName"] = new RegExp(req.query.item, "i");

    const sales = await Sale.find(filter).populate("worker", "name email role").sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    next(error);
  }
}

export async function getSalesSummary(_req, res, next) {
  try {
    const sales = await Sale.find().sort({ createdAt: 1 });
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const totals = sales.reduce(
      (acc, sale) => {
        const created = new Date(sale.createdAt);
        acc.totalSales += sale.totalAmount;
        acc.totalProfit += sale.profit;
        if (created >= startOfToday) acc.dailySales += sale.totalAmount;
        if (created >= startOfWeek) acc.weeklySales += sale.totalAmount;
        if (created >= startOfMonth) acc.monthlySales += sale.totalAmount;
        if (created >= startOfYear) acc.yearlySales += sale.totalAmount;
        return acc;
      },
      { totalSales: 0, totalProfit: 0, dailySales: 0, weeklySales: 0, monthlySales: 0, yearlySales: 0 }
    );

    const dailyTrend = groupByPeriod(sales, "day");
    const weeklyTrend = groupByPeriod(sales, "week");
    const monthlyTrend = groupByPeriod(sales, "month");
    const yearlyTrend = groupByPeriod(sales, "year");

    res.json({ ...totals, dailyTrend, weeklyTrend, monthlyTrend, yearlyTrend });
  } catch (error) {
    next(error);
  }
}

export async function getProfitReport(req, res, next) {
  try {
    const { from, to, groupBy = "day" } = req.query;
    const filter = {};

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const sales = await Sale.find(filter).sort({ createdAt: 1 });
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const marginPercent = totalSales ? (totalProfit / totalSales) * 100 : 0;
    const byItemMap = new Map();
    const byCategoryMap = new Map();

    for (const sale of sales) {
      for (const line of sale.items) {
        const key = line.itemName || "Unknown";
        const current = byItemMap.get(key) || { name: key, sales: 0, profit: 0, quantity: 0 };
        current.sales += line.totalPrice;
        current.profit += line.profit;
        current.quantity += line.quantity;
        byItemMap.set(key, current);

        const categoryKey = line.categoryName || "Others";
        const categoryCurrent = byCategoryMap.get(categoryKey) || { name: categoryKey, sales: 0, profit: 0, quantity: 0 };
        categoryCurrent.sales += line.totalPrice;
        categoryCurrent.profit += line.profit;
        categoryCurrent.quantity += line.quantity;
        byCategoryMap.set(categoryKey, categoryCurrent);
      }
    }

    res.json({
      totalSales,
      totalProfit,
      marginPercent,
      trend: groupByPeriod(sales, groupBy),
      byItem: Array.from(byItemMap.values()),
      byCategory: Array.from(byCategoryMap.values())
    });
  } catch (error) {
    next(error);
  }
}

function groupByPeriod(sales, period) {
  const map = new Map();

  for (const sale of sales) {
    const date = new Date(sale.createdAt);
    const key =
      period === "year"
        ? `${date.getFullYear()}`
        : period === "month"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : period === "week"
          ? `${date.getFullYear()} W${getWeekNumber(date)}`
          : date.toISOString().slice(0, 10);

    const current = map.get(key) || { label: key, sales: 0, profit: 0 };
    current.sales += sale.totalAmount;
    current.profit += sale.profit;
    map.set(key, current);
  }

  return Array.from(map.values()).slice(-12);
}

function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date - firstDay) / 86400000);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}
