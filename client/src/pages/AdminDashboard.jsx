import { BarChart3, CalendarDays, Edit2, Package, Trash2, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { getApiError } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import Message from "../components/Message.jsx";

const pageSize = 10;

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [editingWorker, setEditingWorker] = useState(null);
  const [workerForm, setWorkerForm] = useState({ name: "", email: "", phone: "" });
  const [itemPage, setItemPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [summaryResponse, itemsResponse, workersResponse] = await Promise.all([
        api.get("/sales/summary"),
        api.get("/items"),
        api.get("/users/workers")
      ]);
      setSummary(summaryResponse.data);
      setItems(itemsResponse.data);
      setWorkers(workersResponse.data);
    } catch (error) {
      setError(getApiError(error));
    }
  };

  const startWorkerEdit = (worker) => {
    setEditingWorker(worker._id);
    setWorkerForm({ name: worker.name, email: worker.email, phone: worker.phone });
  };

  const saveWorker = async () => {
    try {
      await api.put(`/users/${editingWorker}`, workerForm);
      setEditingWorker(null);
      await loadDashboard();
    } catch (error) {
      setError(getApiError(error));
    }
  };

  const deleteWorker = async (workerId) => {
    if (!window.confirm("Delete this worker?")) return;
    try {
      await api.delete(`/users/${workerId}`);
      await loadDashboard();
    } catch (error) {
      setError(getApiError(error));
    }
  };

  const totalItemPages = Math.max(Math.ceil(items.length / pageSize), 1);
  const pagedItems = useMemo(() => items.slice((itemPage - 1) * pageSize, itemPage * pageSize), [items, itemPage]);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-coffee-900">Admin Dashboard</h1>
        <p className="mt-2 font-semibold text-coffee-600">Sales reports, workers, item list, and recent sales.</p>
      </div>

      <Message type="error">{error}</Message>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={BarChart3} label="Daily sales" value={`Rs.${summary?.dailySales || 0}`} />
        <Metric icon={TrendingUp} label="Weekly sales" value={`Rs.${summary?.weeklySales || 0}`} />
        <Metric icon={Package} label="Monthly sales" value={`Rs.${summary?.monthlySales || 0}`} />
        <Metric icon={CalendarDays} label="Yearly sales" value={`Rs.${summary?.yearlySales || 0}`} />
      </section>

      <section className="mt-6 space-y-6">
        <ChartPanel title="Daily Sales" data={summary?.dailyTrend || []} />
        <ChartPanel title="Weekly Sales" data={summary?.weeklyTrend || []} />
        <ChartPanel title="Monthly Sales" data={summary?.monthlyTrend || []} />
        <ChartPanel title="Yearly Sales" data={summary?.yearlyTrend || []} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Items List">
          <Table>
            <thead className="bg-coffee-100 text-left text-coffee-800">
              <tr><Th>Category</Th><Th>Item</Th><Th>Price</Th><Th>Balance</Th></tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {pagedItems.map((item) => (
                <tr key={item._id}><Td>{item.category?.name}</Td><Td>{item.itemName}</Td><Td>Rs.{item.sellingPrice}</Td><Td>{item.balance}</Td></tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={itemPage} total={totalItemPages} setPage={setItemPage} />
        </Panel>

        <Panel title="Workers List">
          <div className="space-y-3">
            {workers.map((worker) => (
              <div key={worker._id} className="rounded-md border border-coffee-200 bg-coffee-50 p-3">
                {editingWorker === worker._id ? (
                  <div className="space-y-2">
                    <input className="field-input" value={workerForm.name} onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })} />
                    <input className="field-input" value={workerForm.email} onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })} />
                    <input className="field-input" value={workerForm.phone} onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })} />
                    <button onClick={saveWorker} className="rounded-md bg-leaf px-3 py-2 font-black text-white">Update</button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-coffee-900">{worker.name}</p>
                      <p className="text-sm font-semibold text-coffee-600">{worker.email}</p>
                      <p className="text-sm font-semibold text-coffee-600">{worker.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startWorkerEdit(worker)} className="grid h-9 w-9 place-items-center rounded-md bg-coffee-700 text-cream"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => deleteWorker(worker._id)} className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-700"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </section>

    </Layout>
  );
}

function Metric({ icon: Icon, label, value }) {
  return <article className="rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-wide text-coffee-500">{label}</p><p className="mt-2 text-2xl font-black text-coffee-900">{value}</p></div><div className="grid h-12 w-12 place-items-center rounded-md bg-coffee-700 text-cream"><Icon className="h-6 w-6" /></div></div></article>;
}

function ChartPanel({ title, data }) {
  return <Panel title={title}><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e6cfaa" /><XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis /><Tooltip /><Legend /><Bar dataKey="sales" fill="#88562b" name="Sales" /><Bar dataKey="profit" fill="#4b6b42" name="Profit" /></BarChart></ResponsiveContainer></div></Panel>;
}

function Panel({ title, children, className = "" }) {
  return <section className={`rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft ${className}`}><h2 className="mb-4 text-xl font-black text-coffee-900">{title}</h2>{children}</section>;
}
function Table({ children }) { return <div className="overflow-auto rounded-md border border-coffee-200"><table className="min-w-full divide-y divide-coffee-200 text-sm">{children}</table></div>; }
function Pagination({ page, total, setPage }) { return <div className="mt-4 flex flex-wrap gap-2">{Array.from({ length: total }, (_, i) => i + 1).map((n) => <button key={n} onClick={() => setPage(n)} className={`rounded-md px-3 py-1 font-black ${page === n ? "bg-coffee-700 text-cream" : "bg-coffee-100 text-coffee-700"}`}>{n}</button>)}</div>; }
function Th({ children }) { return <th className="px-4 py-3 font-black">{children}</th>; }
function Td({ children }) { return <td className="px-4 py-3 font-semibold text-coffee-700">{children}</td>; }
