import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api, { getApiError } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import Message from "../components/Message.jsx";
import { useAuth } from "../state/AuthContext.jsx";

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const today = getTodayKey();

export default function Home() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    try {
      const [categoryResponse, itemResponse] = await Promise.all([api.get("/categories"), api.get("/items")]);
      setCategories(categoryResponse.data);
      setItems(itemResponse.data);
    } catch (error) {
      setMessage({ type: "error", text: getApiError(error) });
    }
  };

  const getAvailable = (item) => {
    const itemDate = item.date ? new Date(item.date).toISOString().slice(0, 10) : "";
    if (itemDate !== today) return 0;
    return item.balance;
  };

  const getCartQuantity = (itemId) => cart.find((entry) => entry._id === itemId)?.quantity || 0;

  const getVisibleAvailable = (item) => Math.max(getAvailable(item) - getCartQuantity(item._id), 0);

  const orderedItems = useMemo(() => {
    return [...items].sort((a, b) => (b.sold || 0) - (a.sold || 0));
  }, [items]);

  const filteredItems = useMemo(() => {
    return orderedItems.filter((item) => {
      const matchesSearch = item.itemName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory ? item.category?._id === selectedCategory : true;
      const matchesPrice = priceFilter ? Number(item.sellingPrice) === Number(priceFilter) : true;
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [orderedItems, search, selectedCategory, priceFilter]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((groups, item) => {
      const categoryName = item.category?.name || "Others";
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(item);
      return groups;
    }, {});
  }, [filteredItems]);

  const updateCartQuantity = (item, value) => {
    setMessage(null);
    const quantity = Number(value);
    const existing = cart.find((entry) => entry._id === item._id);
    const available = getAvailable(item);

    if (!quantity || quantity <= 0) {
      setCart((current) => current.filter((entry) => entry._id !== item._id));
      return;
    }

    if (quantity > available) {
      setMessage({ type: "warning", text: `Available quantity ${available} for ${item.itemName}` });
      return;
    }

    setCart((current) =>
      existing
        ? current.map((entry) => (entry._id === item._id ? { ...entry, quantity } : entry))
        : [...current, { ...item, quantity }]
    );
  };

  const changeCartQuantity = (item, delta) => {
    updateCartQuantity(item, Number(item.quantity || 0) + delta);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);
  const finalDiscount = Math.min(Number(discount || 0), subtotal);
  const total = subtotal - finalDiscount;
  const balance = Math.max(Number(amountReceived || 0) - total, 0);

  const checkout = async () => {
    if (!user) {
      setMessage({ type: "error", text: "Please login before completing billing" });
      return;
    }

    try {
      await api.post("/sales", {
        discount: finalDiscount,
        paymentMethod,
        billAmount: total,
        amountReceived: paymentMethod === "upi" ? total : Number(amountReceived || 0),
        items: cart.map((item) => ({ item: item._id, quantity: item.quantity }))
      });
      setCart([]);
      setDiscount("");
      setAmountReceived("");
      setMessage({ type: "success", text: "Bill completed successfully" });
      await loadStore();
    } catch (error) {
      setMessage({ type: "error", text: getApiError(error) });
    }
  };

  return (
    <Layout>
      <div className="grid h-[calc(100vh-96px)] gap-5 overflow-hidden lg:grid-cols-[2.65fr_1.35fr]">
      <div className="min-w-0 min-h-0 flex flex-col overflow-hidden">
      <section className="mb-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-md bg-coffee-800 p-6 text-cream shadow-soft">
          <p className="text-sm font-bold uppercase tracking-widest text-caramel">Fresh billing counter</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Tea, coffee, snacks and cool drinks in one fast counter.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-coffee-100">
            Search items, add quantities, check stock instantly, apply discounts, and complete the sale.
          </p>
        </div>
        <div className="rounded-md border border-coffee-200 bg-white/75 p-5 shadow-soft">
          <p className="text-sm font-bold text-coffee-600">Current login</p>
          <p className="mt-2 text-2xl font-black text-coffee-800">{user ? `${user.name} (${user.role})` : "Guest user"}</p>
          <p className="mt-2 text-sm font-semibold text-coffee-600">
            Workers and admins can bill items. Admins can also view sales and profit reports.
          </p>
        </div>
      </section>

      <section className="mb-3 grid gap-3 lg:grid-cols-[1fr_220px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-coffee-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-md border border-coffee-300 bg-white px-10 py-3 font-semibold outline-none focus:border-coffee-700"
            placeholder="Search item"
          />
        </div>
        <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="field-input mt-0">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>{category.name}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          value={priceFilter}
          onChange={(event) => setPriceFilter(event.target.value)}
          className="field-input mt-0"
          placeholder="Search by price"
        />
      </section>

      <Message type={message?.type}>{message?.text}</Message>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full min-h-0 space-y-6 overflow-y-auto pb-4 pr-2 scrollbar-thin">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="rounded-md border border-dashed border-coffee-300 bg-white/60 p-10 text-center">
              <p className="text-lg font-black text-coffee-800">No items.</p>
            </div>
          ) : Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
            <section key={categoryName}>
              <h2 className="mb-3 text-xl font-black text-coffee-800">{categoryName}</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categoryItems.map((item) => {
                  const cartItem = cart.find((entry) => entry._id === item._id);
                  const available = getVisibleAvailable(item);
                  return (
                    <article key={item._id} className="grid grid-cols-[1fr_96px] gap-3 rounded-md border border-coffee-200 bg-white/80 p-3 shadow-soft">
                      <div>
                        <p className="text-base font-black text-coffee-900">{item.itemName}</p>
                        <p className="text-sm font-semibold text-coffee-600">Available: {available}</p>
                        <p className="text-lg font-black text-coffee-800">Rs.{item.sellingPrice}</p>
                      </div>
                      <label className="block">
                        <span className="text-xs font-black text-coffee-700">Add qty</span>
                        <input
                          type="number"
                          min="0"
                          value={cartItem?.quantity || ""}
                          onChange={(event) => updateCartQuantity(item, event.target.value)}
                          className="field-input"
                          placeholder="Qty"
                        />
                      </label>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
      </div>

        <aside className="flex min-h-0 h-full flex-col rounded-md border border-coffee-200 bg-cream p-4 shadow-soft">
          <h2 className="text-xl font-black text-coffee-900">Cart</h2>
          <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {cart.map((item) => (
              <div key={item._id} className="grid grid-cols-[minmax(150px,1fr)_auto_auto_auto] items-center gap-3 rounded-md bg-white/80 p-2 text-sm">
                <p className="min-w-0 truncate font-black text-coffee-800" title={item.itemName}>{item.itemName}</p>
                <div className="flex items-center gap-1">
                    <button onClick={() => changeCartQuantity(item, -1)} className="grid h-6 w-6 place-items-center rounded bg-coffee-700 text-cream" title="Reduce">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="min-w-16 text-center text-xs font-bold text-coffee-600">{item.quantity} x {item.sellingPrice}</span>
                    <button onClick={() => changeCartQuantity(item, 1)} className="grid h-6 w-6 place-items-center rounded bg-leaf text-white" title="Add">
                      <Plus className="h-3 w-3" />
                    </button>
                </div>
                <p className="font-black text-coffee-900">Rs.{item.quantity * item.sellingPrice}</p>
                <button onClick={() => updateCartQuantity(item, 0)} className="text-red-700" title="Remove item">
                    <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {cart.length === 0 && <p className="text-sm font-semibold text-coffee-600">No items added.</p>}
          </div>

          <label className="mt-4 block text-sm font-black text-coffee-700">Discount</label>
          <input type="number" min="0" value={discount} onChange={(event) => setDiscount(event.target.value)} className="field-input" />

          <div className="mt-3 space-y-1 text-sm font-bold text-coffee-700">
            <div className="flex justify-between"><span>Subtotal</span><span>Rs.{subtotal}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>Rs.{finalDiscount}</span></div>
            <div className="flex justify-between border-t border-coffee-200 pt-2 text-lg text-coffee-900"><span>Total</span><span>Rs.{total}</span></div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setPaymentMethod("cash")} className={`rounded-md px-3 py-2 font-black ${paymentMethod === "cash" ? "bg-coffee-700 text-cream" : "bg-white text-coffee-700"}`}>Cash</button>
            <button onClick={() => setPaymentMethod("upi")} className={`rounded-md px-3 py-2 font-black ${paymentMethod === "upi" ? "bg-coffee-700 text-cream" : "bg-white text-coffee-700"}`}>UPI</button>
          </div>

          {paymentMethod === "cash" && (
            <div className="mt-3 space-y-2">
              <input className="field-input" type="number" min="0" value={amountReceived} onChange={(event) => setAmountReceived(event.target.value)} placeholder="Amount received" />
              <p className="font-black text-coffee-900">Balance: Rs.{balance}</p>
            </div>
          )}

          <button onClick={checkout} disabled={cart.length === 0} className="mt-4 w-full rounded-md bg-leaf px-4 py-3 font-black text-white hover:bg-green-800 disabled:bg-coffee-300">
            Complete Bill
          </button>
        </aside>
      </div>
    </Layout>
  );
}
