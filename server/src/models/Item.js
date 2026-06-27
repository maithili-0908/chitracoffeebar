import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    sold: {
      type: Number,
      default: 0,
      min: 0
    },
    balance: {
      type: Number,
      required: true,
      min: 0
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    profitAmount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

itemSchema.pre("validate", function setComputedFields(next) {
  this.balance = Math.max((this.totalQuantity || 0) - (this.sold || 0), 0);
  this.price = this.sellingPrice ?? this.price;
  this.profitAmount = ((this.sellingPrice || 0) - (this.purchasePrice || 0)) * (this.sold || 0);
  next();
});

export default mongoose.model("Item", itemSchema);
