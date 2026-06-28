import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api, { getApiError } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import Message from "../components/Message.jsx";

function getTodayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const today = getTodayKey();

export default function StockPage() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [rows, setRows] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [message, setMessage] = useState(null);
  const [savingId, setSavingId] = useState("");
  const [savingAll, setSavingAll] = useState(false);

  const isToday = selectedDate === today;

  useEffect(() => {
    loadStock(selectedDate);
  }, [selectedDate]);

  const loadStock = async (date) => {
    try {
      const { data } = await api.get(`/items/stock?date=${date}`);
      setRows(data);
      setFormValues(
        data.reduce((values, row) => {
          values[row.item] = {
            quantity: String(row.totalQuantity || ""),
            sold: String(row.sold || 0)
          };
          return values;
        }, {})
      );
    } catch (error) {
      setMessage({ type: "error", text: getApiError(error) });
    }
  };

  const updateStock = async (itemId) => {
    setMessage(null);
    setSavingId(itemId);
    try {
      await api.patch(`/items/${itemId}/daily-stock`, {
        date: today,
        quantity: formValues[itemId]?.quantity || 0,
        sold: formValues[itemId]?.sold || 0
      });
      setMessage({ type: "success", text: "Stock updated" });
      await loadStock(selectedDate);
    } catch (error) {
      setMessage({ type: "error", text: getApiError(error) });
    } finally {
      setSavingId("");
    }
  };

  const updateAllStock = async () => {
    setMessage(null);
    setSavingAll(true);
    try {
      const todayRows = rows.filter((row) => formValues[row.item]);
      await Promise.all(
        todayRows.map((row) =>
          api.patch(`/items/${row.item}/daily-stock`, {
            date: today,
            quantity: formValues[row.item]?.quantity || 0,
            sold: formValues[row.item]?.sold || 0
          })
        )
      );
      setMessage({ type: "success", text: "All items updated" });
      await loadStock(selectedDate);
    } catch (error) {
      setMessage({ type: "error", text: getApiError(error) });
    } finally {
      setSavingAll(false);
    }
  };

  const updateValue = (itemId, field, value) => {
    setFormValues((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        [field]: value
      }
    }));
  };

  const groupedRows = useMemo(() => {
    return rows.reduce((groups, row) => {
      const categoryName = row.category?.name || "Others";
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(row);
      return groups;
    }, {});
  }, [rows]);

  return (
    <Layout>
      <section className="mb-6 rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-coffee-900">Daily Stock Update</h1>
            <p className="mt-2 font-semibold text-coffee-600">
              Add Date next to daily stock update to view today or previous stock records.
            </p>
          </div>
          <label className="block">
            <span className="text-sm font-black text-coffee-700">Add Date</span>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="field-input min-w-52"
            />
          </label>
        </div>
      </section>

      <Message type={message?.type}>{message?.text}</Message>

      <div className="mt-5 space-y-6">
        {Object.entries(groupedRows).map(([categoryName, categoryRows]) => (
          <section key={categoryName} className="rounded-md border border-coffee-200 bg-white/80 p-5 shadow-soft">
            <h2 className="mb-4 text-xl font-black text-coffee-900">{categoryName}</h2>
            <div className="overflow-auto rounded-md border border-coffee-200">
              <table className="min-w-full divide-y divide-coffee-200 text-sm">
                <thead className="bg-coffee-100 text-left text-coffee-800">
                  <tr>
                    <Th>Item</Th>
                    <Th>Total</Th>
                    <Th>Sold</Th>
                    <Th>Balance</Th>
                    <Th>Modify</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-100 bg-white/70">
                  {categoryRows.map((row) => {
                    const quantity = Number(formValues[row.item]?.quantity || 0);
                    const sold = Number(formValues[row.item]?.sold || 0);
                    const balance = Math.max(quantity - sold, 0);
                    return (
                      <tr key={row.item}>
                        <Td>{row.itemName}</Td>
                        <Td>
                          <input
                            disabled={!isToday}
                            min="0"
                            type="number"
                            value={formValues[row.item]?.quantity ?? ""}
                            onChange={(event) => updateValue(row.item, "quantity", event.target.value)}
                            className="field-input min-w-28"
                            placeholder="Qty"
                          />
                        </Td>
                        <Td>
                          <input
                            disabled={!isToday}
                            min="0"
                            type="number"
                            value={formValues[row.item]?.sold ?? ""}
                            onChange={(event) => updateValue(row.item, "sold", event.target.value)}
                            className="field-input min-w-28"
                            placeholder="Sold"
                          />
                        </Td>
                        <Td>{isToday ? balance : row.balance}</Td>
                        <Td>
                          <button
                            onClick={() => updateStock(row.item)}
                            disabled={!isToday || savingId === row.item}
                            className="flex items-center gap-2 rounded-md bg-leaf px-3 py-2 font-black text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-coffee-300"
                          >
                            <Save className="h-4 w-4" />
                            {savingId === row.item ? "Saving" : "Update"}
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {rows.length === 0 && (
          <div className="rounded-md border border-dashed border-coffee-300 bg-white/60 p-10 text-center">
            <p className="text-lg font-black text-coffee-800">No items added yet.</p>
            <p className="mt-2 font-semibold text-coffee-600">Create item names first from the Items page.</p>
          </div>
        )}
        {rows.length > 0 && isToday && (
          <button
            onClick={updateAllStock}
            disabled={savingAll}
            className="w-full rounded-md bg-coffee-700 px-4 py-3 font-black text-cream hover:bg-coffee-800 disabled:cursor-not-allowed disabled:bg-coffee-300"
          >
            {savingAll ? "Updating Items" : "Update Items"}
          </button>
        )}
      </div>
    </Layout>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 font-black">{children}</th>;
}

function Td({ children }) {
  return <td className="px-4 py-3 font-semibold text-coffee-700">{children}</td>;
}
