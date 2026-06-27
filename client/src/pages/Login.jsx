import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Coffee } from "lucide-react";
import { getApiError } from "../api/client.js";
import Message from "../components/Message.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const user = await login(form);
      navigate(user.role === "admin" ? "/admin" : "/worker");
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <AuthShell title="Login">
      <form onSubmit={submit} className="space-y-4">
        <Message type="error">{error}</Message>
        <Input label="Email ID" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <button className="w-full rounded-md bg-coffee-700 px-4 py-3 font-black text-cream hover:bg-coffee-800">Login</button>
        <div className="flex flex-wrap justify-between gap-2 text-sm font-bold">
          <Link to="/forgot-password" className="text-coffee-700 hover:underline">
            Forgot password?
          </Link>
          <span className="text-coffee-600">
            Dont have account?{" "}
            <Link to="/signin" className="text-coffee-800 hover:underline">
              Register
            </Link>
          </span>
        </div>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, children }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="w-full max-w-md rounded-md border border-coffee-200 bg-cream p-6 shadow-soft">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-2xl font-black text-coffee-800">
          <Coffee className="h-7 w-7 text-coffee-600" />
          Chitra Coffee Bar ☕
        </Link>
        <h1 className="mb-5 text-center text-3xl font-black text-coffee-900">{title}</h1>
        {children}
      </section>
    </main>
  );
}

export function Input({ label, value, onChange, type = "text", required = true }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-coffee-700">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-coffee-300 bg-white px-3 py-3 font-semibold outline-none focus:border-coffee-700"
      />
    </label>
  );
}
