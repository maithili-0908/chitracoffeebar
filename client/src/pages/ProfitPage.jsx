import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { getApiError } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import Message from "../components/Message.jsx";

const colors = ["#88562b", "#4b6b42", "#d99a4e", "#6f3f21", "#ad7b43", "#552f1d"];

function key(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function rangeFor(groupBy) {
  const now = new Date();
  const from = new Date(now);
  if (groupBy === "week") from.setDate(now.getDate() - 6);
  if (groupBy === "month") from.setDate(1);
  if (groupBy === "year") from.setMonth(0, 1);
  return { from: key(groupBy === "day" ? now : from), to: key(now) };
}

export default function ProfitPage() {
  const initial = rangeFor("day");
  const [filters, setFilters] = useState({ ...initial, groupBy: "day", chart: "pie", view: "item" });
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport(filters);
  }, []);

  const loadReport = async (activeFilters = filters) => {
    try {
      const params = new URLSearchParams();
      ["from", "to", "groupBy"].forEach((field) => activeFilters[field] && params.set(field, activeFilters[field]));
      const { data } = await api.get(`/sales/profit?${params.toString()}`);
      setReport(data);
    } catch (error) {
      setError(getApiError(error));
    }
  };

  const setPeriod = (groupBy) => {
    const next = { ...filters, groupBy, ...rangeFor(groupBy), chart: groupBy === "day" ? "pie" : filters.chart };
    setFilters(next);
  };

  const clearFilters = () => {
    const next = { ...rangeFor("day"), groupBy: "day", chart: "pie", view: "item" };
    setFilters(next);
    loadReport(next);
  };

  const chartData = useMemo(() => {
    const source = filters.view === "category" ? report?.byCategory || [] : report?.byItem || [];
    const data = source.length ? source : report?.trend || [];
    return data.map((row) => ({ ...row, name: row.name || row.label || "Sales" }));
  }, [report, filters.view]);

  const title = `${filters.groupBy[0].toUpperCase()}${filters.groupBy.slice(1)} Sales: ${filters.from}${filters.from !== filters.to ? ` to ${filters.to}` : ""}`;

  return (
    <Layout>
      <section className="mb-6 rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
        <h1 className="text-3xl font-black text-coffee-900">Profit</h1>
        <p className="mt-2 font-semibold text-coffee-600">Daily sales pie chart is the default. Change period or date range as needed.</p>
      </section>

      <Message type="error">{error}</Message>

      <section className="grid gap-3 rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft md:grid-cols-7">
        <input type="date" className="field-input mt-0" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" className="field-input mt-0" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <select className="field-input mt-0" value={filters.groupBy} onChange={(e) => setPeriod(e.target.value)}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </select>
        <select className="field-input mt-0" value={filters.view} onChange={(e) => setFilters({ ...filters, view: e.target.value })}>
          <option value="item">Each item</option>
          <option value="category">Each category</option>
        </select>
        <select className="field-input mt-0" value={filters.chart} onChange={(e) => setFilters({ ...filters, chart: e.target.value })}>
          <option value="pie">Pie chart</option>
          <option value="bar">Bar chart</option>
        </select>
        <button onClick={() => loadReport()} className="rounded-md bg-coffee-700 px-4 py-2 font-black text-cream">Apply</button>
        <button onClick={clearFilters} className="rounded-md border border-coffee-300 px-4 py-2 font-black text-coffee-700">Clear</button>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <Metric label={`${filters.groupBy} sales`} value={`Rs.${report?.totalSales?.toFixed?.(2) || 0}`} />
        <Metric label={`${filters.groupBy} profit`} value={`Rs.${report?.totalProfit?.toFixed?.(2) || 0}`} />
        <Metric label="Profit %" value={`${report?.marginPercent?.toFixed?.(2) || 0}%`} />
      </section>

      <section className="mt-5 rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
        <h2 className="mb-4 text-xl font-black text-coffee-900">{title}</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {filters.chart === "pie" ? (
              <PieChart>
                <Pie data={chartData} dataKey="sales" nameKey="name" outerRadius={130} label>
                  {chartData.map((_entry, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#88562b" />
                <Bar dataKey="profit" fill="#4b6b42" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>
    </Layout>
  );
}

function Metric({ label, value }) {
  return (
    <article className="rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
      <p className="text-sm font-black uppercase tracking-wide text-coffee-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-coffee-900">{value}</p>
    </article>
  );
}
