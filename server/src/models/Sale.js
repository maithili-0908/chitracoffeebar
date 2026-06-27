import mongoose from "mongoose";

const saleLineSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true
    },
    itemName: String,
    categoryName: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    profit: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    items: [saleLineSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi"],
      default: "cash"
    },
    billAmount: {
      type: Number,
      default: 0
    },
    amountReceived: {
      type: Number,
      default: 0
    },
    balanceReturned: {
      type: Number,
      default: 0
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);
