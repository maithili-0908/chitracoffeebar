import { Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api, { getApiError } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import Message from "../components/Message.jsx";

const emptyItem = {
  category: "",
  itemName: "",
  purchasePrice: "",
  sellingPrice: ""
};

export default function WorkerPanel() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState({ name: "", purchasePrice: "", sellingPrice: "", category: "" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoryResponse, itemResponse] = await Promise.all([api.get("/categories"), api.get("/items")]);
      setCategories(categoryResponse.data);
      setItems(itemResponse.data);
    } catch (error) {
      setMessage({ type: "error", text: getApiError(error) });
    }
  };

  const addCategory = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      await api.post("/categories", { name: categoryName });
      setCategoryName("");
      setMessage({ type: "success", text: "Category added" });
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: getApiError(error) });
    }
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      if (editingId) {
        await api.put(`/items/${editingId}`, itemForm);
        setMessage({ type: "success", text: "Item updated successfully" });
      } else {
        await api.post("/items", itemForm);
        setMessage({ type: "success", text: "Item added successfully" });
      }
      setItemForm(emptyItem);
      setEditingId(null);
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: getApiError(error) });
    }
  };

  const editItem = (item) => {
    setEditingId(item._id);
    setItemForm({
      category: item.category?._id || item.category,
      itemName: item.itemName,
      purchasePrice: String(item.purchasePrice),
      sellingPrice: String(item.sellingPrice)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteItem = async (id) => {
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    setMessage(null);
    try {
      await api.delete(`/items/${id}`);
      setMessage({ type: "success", text: "Item deleted" });
      if (editingId === id) cancelEdit();
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: getApiError(error) });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setItemForm(emptyItem);
  };

  const updateItemForm = (field, value) => {
    setItemForm((current) => ({ ...current, [field]: value }));
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const nameMatch = item.itemName.toLowerCase().includes(filters.name.toLowerCase());
      const purchaseMatch = filters.purchasePrice ? Number(item.purchasePrice) === Number(filters.purchasePrice) : true;
      const sellingMatch = filters.sellingPrice ? Number(item.sellingPrice) === Number(filters.sellingPrice) : true;
      const categoryMatch = filters.category ? item.category?._id === filters.category : true;
      return nameMatch && purchaseMatch && sellingMatch && categoryMatch;
    });
  }, [items, filters]);

  const pageSize = 10;
  const totalPages = Math.max(Math.ceil(filteredItems.length / pageSize), 1);
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Layout>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
            <h1 className="text-2xl font-black text-coffee-900">Item Master</h1>
            <p className="mt-2 text-sm font-semibold text-coffee-600">
              Add each item only once. Daily quantity is updated separately from the Stock page.
            </p>
          </section>

          <section className="rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
            <h2 className="mb-4 text-lg font-black text-coffee-800">Add Category</h2>
            <form onSubmit={addCategory} className="space-y-3">
              <input
                required
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                className="w-full rounded-md border border-coffee-300 bg-white px-3 py-3 font-semibold outline-none focus:border-coffee-700"
                placeholder="Soft drinks, Hot beverages, Snacks"
              />
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-coffee-700 px-4 py-3 font-black text-cream hover:bg-coffee-800">
                <Plus className="h-5 w-5" />
                Add Category
              </button>
            </form>
          </section>

          <Message type={message?.type}>{message?.text}</Message>
        </aside>

        <section className="rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-coffee-900">{editingId ? "Edit Item" : "Add Item"}</h2>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-2 rounded-md border border-coffee-300 px-3 py-2 text-sm font-black text-coffee-700 hover:bg-coffee-100"
              >
                <X className="h-4 w-4" />
                Cancel Edit
              </button>
            )}
          </div>
          <form onSubmit={saveItem} className="grid gap-4 md:grid-cols-2">
            <Field label="Category">
              <select
                required
                value={itemForm.category}
                onChange={(event) => updateItemForm("category", event.target.value)}
                className="field-input"
              >
                <option value="">Select category before adding item</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Item name">
              <input required className="field-input" value={itemForm.itemName} onChange={(event) => updateItemForm("itemName", event.target.value)} />
            </Field>
            <Field label="Purchase price">
              <input required min="0" type="number" className="field-input" value={itemForm.purchasePrice} onChange={(event) => updateItemForm("purchasePrice", event.target.value)} />
            </Field>
            <Field label="Selling price">
              <input required min="0" type="number" className="field-input" value={itemForm.sellingPrice} onChange={(event) => updateItemForm("sellingPrice", event.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-leaf px-4 py-3 font-black text-white hover:bg-green-800">
                <Save className="h-5 w-5" />
                {editingId ? "Update Item" : "Save Item"}
              </button>
            </div>
          </form>

        </section>
      </div>

      <section className="mt-6 rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
          <h3 className="mb-3 text-lg font-black text-coffee-800">Item List</h3>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <input className="field-input mt-0" value={filters.name} onChange={(e) => { setFilters({ ...filters, name: e.target.value }); setPage(1); }} placeholder="Search name" />
            <input type="number" className="field-input mt-0" value={filters.purchasePrice} onChange={(e) => { setFilters({ ...filters, purchasePrice: e.target.value }); setPage(1); }} placeholder="Purchase price" />
            <input type="number" className="field-input mt-0" value={filters.sellingPrice} onChange={(e) => { setFilters({ ...filters, sellingPrice: e.target.value }); setPage(1); }} placeholder="Selling price" />
            <select className="field-input mt-0" value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </div>
          <div className="overflow-auto rounded-md border border-coffee-200">
            <table className="min-w-full divide-y divide-coffee-200 text-sm">
              <thead className="bg-coffee-100 text-left text-coffee-800">
                <tr>
                  <Th>Category</Th>
                  <Th>Item</Th>
                  <Th>Purchase Price</Th>
                  <Th>Selling Price</Th>
                  <Th>Modify</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100 bg-white/70">
                {pagedItems.map((item) => (
                  <tr key={item._id}>
                    <Td>{item.category?.name}</Td>
                    <Td>{item.itemName}</Td>
                    <Td>Rs.{item.purchasePrice}</Td>
                    <Td>Rs.{item.sellingPrice}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editItem(item)}
                          className="grid h-9 w-9 place-items-center rounded-md bg-coffee-700 text-cream hover:bg-coffee-800"
                          title="Edit item"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item._id)}
                          className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                          title="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNo) => (
              <button key={pageNo} onClick={() => setPage(pageNo)} className={`rounded-md px-3 py-1 font-black ${pageNo === page ? "bg-coffee-700 text-cream" : "bg-coffee-100 text-coffee-700"}`}>
                {pageNo}
              </button>
            ))}
          </div>
        </section>
    </Layout>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-coffee-700">{label}</span>
      {children}
    </label>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 font-black">{children}</th>;
}

function Td({ children }) {
  return <td className="px-4 py-3 font-semibold text-coffee-700">{children}</td>;
}
