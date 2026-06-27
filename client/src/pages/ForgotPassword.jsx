import { useState } from "react";
import { Link } from "react-router-dom";
import api, { getApiError } from "../api/client.js";
import Message from "../components/Message.jsx";
import { AuthShell, Input } from "./Login.jsx";

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      const { data } = await api.post("/auth/reset-password", form);
      setMessage({ type: "success", text: data.message });
    } catch (error) {
      setMessage({ type: "error", text: getApiError(error) });
    }
  };

  return (
    <AuthShell title="Reset Password">
      <form onSubmit={submit} className="space-y-4">
        <Message type={message?.type}>{message?.text}</Message>
        <Input label="Email ID" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="New password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <Input
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={(confirmPassword) => setForm({ ...form, confirmPassword })}
        />
        <button className="w-full rounded-md bg-coffee-700 px-4 py-3 font-black text-cream hover:bg-coffee-800">
          Reset Password
        </button>
        <Link to="/login" className="block text-center text-sm font-bold text-coffee-700 hover:underline">
          Back to login
        </Link>
      </form>
    </AuthShell>
  );
}
