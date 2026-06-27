import { X } from "lucide-react";
import { useEffect, useState } from "react";
import api, { getApiError } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import Message from "../components/Message.jsx";

export default function SalesPage() {
  const [workers, setWorkers] = useState([]);
  const [sales, setSales] = useState([]);
  const [filters, setFilters] = useState({ date: "", worker: "", item: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      const [workersResponse, salesResponse] = await Promise.all([api.get("/users/workers"), api.get("/sales")]);
      setWorkers(workersResponse.data);
      setSales(salesResponse.data);
    } catch (error) {
      setError(getApiError(error));
    }
  };

  const loadSales = async (nextFilters = filters) => {
    try {
      const params = new URLSearchParams();
      if (nextFilters.date) params.set("date", nextFilters.date);
      if (nextFilters.worker) params.set("worker", nextFilters.worker);
      if (nextFilters.item) params.set("item", nextFilters.item);
      const { data } = await api.get(`/sales?${params.toString()}`);
      setSales(data);
    } catch (error) {
      setError(getApiError(error));
    }
  };

  const clearFilters = async () => {
    const cleared = { date: "", worker: "", item: "" };
    setFilters(cleared);
    await loadSales(cleared);
  };

  return (
    <Layout>
      <section className="mb-6 rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
        <h1 className="text-3xl font-black text-coffee-900">Sales</h1>
        <p className="mt-2 font-semibold text-coffee-600">Recent sales with filters by date, worker, and item sold.</p>
      </section>

      <Message type="error">{error}</Message>

      <section className="rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <input type="date" className="field-input mt-0" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
          <select className="field-input mt-0" value={filters.worker} onChange={(e) => setFilters({ ...filters, worker: e.target.value })}>
            <option value="">All</option>
            {workers.map((worker) => <option key={worker._id} value={worker._id}>{worker.name}</option>)}
          </select>
          <input className="field-input mt-0" value={filters.item} onChange={(e) => setFilters({ ...filters, item: e.target.value })} placeholder="Item sold" />
          <button onClick={() => loadSales()} className="rounded-md bg-coffee-700 px-4 py-2 font-black text-cream">Filter</button>
          <button onClick={clearFilters} className="flex items-center justify-center gap-2 rounded-md border border-coffee-300 px-4 py-2 font-black text-coffee-700">
            <X className="h-4 w-4" /> Clear
          </button>
        </div>

        <div className="overflow-auto rounded-md border border-coffee-200">
          <table className="min-w-full divide-y divide-coffee-200 text-sm">
            <thead className="bg-coffee-100 text-left text-coffee-800">
              <tr><Th>Date</Th><Th>Worker</Th><Th>Items</Th><Th>Discount</Th><Th>Total</Th><Th>Profit</Th></tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <Td>{new Date(sale.createdAt).toLocaleString()}</Td>
                  <Td>{sale.worker?.name || "Admin"}</Td>
                  <Td>{sale.items.map((item) => `${item.itemName} x${item.quantity}`).join(", ")}</Td>
                  <Td>Rs.{sale.discount}</Td>
                  <Td>Rs.{sale.totalAmount}</Td>
                  <Td>Rs.{sale.profit}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 font-black">{children}</th>;
}

function Td({ children }) {
  return <td className="px-4 py-3 font-semibold text-coffee-700">{children}</td>;
}
