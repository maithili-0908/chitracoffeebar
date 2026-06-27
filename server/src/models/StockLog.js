import mongoose from "mongoose";

const stockLogSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true
    },
    date: {
      type: String,
      required: true
    },
    totalQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    sold: {
      type: Number,
      default: 0,
      min: 0
    },
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    profitAmount: {
      type: Number,
      default: 0
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

stockLogSchema.index({ item: 1, date: 1 }, { unique: true });

export default mongoose.model("StockLog", stockLogSchema);
