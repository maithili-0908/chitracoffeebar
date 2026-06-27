import { Minus, Plus, Trash2, X } from "lucide-react";
import Message from "./Message.jsx";

export default function CartDrawer({
  open,
  cart,
  discount,
  setDiscount,
  onClose,
  onCheckout,
  onAdd,
  onReduce,
  onRemove,
  message
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);
  const finalDiscount = Math.min(Number(discount || 0), subtotal);
  const discountPerItem = cart.length ? finalDiscount / cart.length : 0;
  const total = subtotal - finalDiscount;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-coffee-900/40">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-cream shadow-soft">
        <div className="flex items-center justify-between border-b border-coffee-200 px-5 py-4">
          <h2 className="text-lg font-black text-coffee-800">Billing Cart</h2>
          <button onClick={onClose} className="rounded-md p-2 text-coffee-700 hover:bg-coffee-100" title="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-auto p-5 scrollbar-thin">
          <Message type={message?.type}>{message?.text}</Message>
          {cart.length === 0 ? (
            <p className="rounded-md border border-dashed border-coffee-300 p-6 text-center font-semibold text-coffee-600">
              No items added yet.
            </p>
          ) : (
            cart.map((item) => (
              <div key={item._id} className="rounded-md border border-coffee-200 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-coffee-800">{item.itemName}</p>
                    <p className="text-sm text-coffee-600">
                      Qty {item.quantity} x Rs.{item.sellingPrice}
                    </p>
                    {finalDiscount > 0 && (
                      <p className="text-xs font-bold text-leaf">
                        Discount share Rs.{discountPerItem.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-black text-coffee-800">
                      Rs.{Math.max(item.quantity * item.sellingPrice - discountPerItem, 0).toFixed(2)}
                    </p>
                    {finalDiscount > 0 && (
                      <p className="text-xs font-semibold text-coffee-500 line-through">
                        Rs.{item.quantity * item.sellingPrice}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onReduce(item)}
                    className="grid h-9 w-9 place-items-center rounded-md bg-coffee-700 text-cream hover:bg-coffee-800"
                    title="Reduce quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="rounded-md bg-coffee-50 px-4 py-2 text-sm font-black text-coffee-800">{item.quantity}</span>
                  <button
                    onClick={() => onAdd(item)}
                    className="grid h-9 w-9 place-items-center rounded-md bg-leaf text-white hover:bg-green-800"
                    title="Add quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onRemove(item._id)}
                    className="ml-auto grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-coffee-200 p-5">
          <label className="text-sm font-bold text-coffee-700">Discount amount</label>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
              className="w-full rounded-md border border-coffee-300 bg-white px-3 py-2 outline-none focus:border-coffee-600"
              placeholder="Enter discount"
            />
            <button className="rounded-md bg-caramel px-4 py-2 font-black text-coffee-900">Add</button>
          </div>
          <div className="mt-4 space-y-2 text-sm font-bold text-coffee-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs.{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>Rs.{finalDiscount}</span>
            </div>
            <div className="flex justify-between border-t border-coffee-200 pt-3 text-lg text-coffee-900">
              <span>Total</span>
              <span>Rs.{total}</span>
            </div>
          </div>
          <button
            onClick={onCheckout}
            disabled={cart.length === 0}
            className="mt-4 w-full rounded-md bg-coffee-700 px-4 py-3 font-black text-cream hover:bg-coffee-800 disabled:cursor-not-allowed disabled:bg-coffee-300"
          >
            Complete Bill
          </button>
        </div>
      </aside>
    </div>
  );
}
