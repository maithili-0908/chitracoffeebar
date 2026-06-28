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

export function AuthShell({ title, children, compact = false }) {
  return (
    <main className={`grid min-h-screen place-items-center px-4 ${compact ? "py-3" : "py-8"}`}>
      <section className={`w-full rounded-md border border-coffee-200 bg-cream shadow-soft ${compact ? "max-w-sm p-4" : "max-w-md p-6"}`}>
        <Link to="/" className={`flex items-center justify-center gap-2 font-black text-coffee-800 ${compact ? "mb-3 text-xl" : "mb-6 text-2xl"}`}>
          <Coffee className={`${compact ? "h-6 w-6" : "h-7 w-7"} text-coffee-600`} />
          Chitra Coffee Bar ☕
        </Link>
        <h1 className={`text-center font-black text-coffee-900 ${compact ? "mb-3 text-2xl" : "mb-5 text-3xl"}`}>{title}</h1>
        {children}
      </section>
    </main>
  );
}

export function Input({ label, value, onChange, type = "text", required = true, autoComplete, name, compact = false }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-coffee-700">{label}</span>
      <input
        required={required}
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full rounded-md border border-coffee-300 bg-white px-3 font-semibold outline-none focus:border-coffee-700 ${compact ? "py-2" : "py-3"}`}
      />
    </label>
  );
}
