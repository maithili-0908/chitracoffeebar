import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiError } from "../api/client.js";
import Message from "../components/Message.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { AuthShell, Input } from "./Login.jsx";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: ""
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("admin");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const user = await register({ ...form, role });
      navigate(user.role === "admin" ? "/admin" : "/worker");
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <AuthShell title="Sign in" compact>
      <div className="mb-3 grid grid-cols-2 gap-3">
        {["admin", "worker"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setRole(option);
              setForm(emptyForm);
              setError("");
            }}
            className={`rounded-md px-4 py-2 font-black capitalize ${
              role === option ? "bg-coffee-700 text-cream" : "border border-coffee-300 bg-white text-coffee-700"
            }`}
          >
            {option === "worker" ? "Worker (Agent)" : "Admin"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-2" autoComplete="off">
        <Message type="error">{error}</Message>
        <Input compact label="Name" name={`signup-${role}-name`} autoComplete="off" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Input compact label="Email" name={`signup-${role}-email`} autoComplete="off" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input compact label="Phone number" name={`signup-${role}-phone`} autoComplete="off" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        <Input compact label="Password" name={`signup-${role}-password`} autoComplete="new-password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <Input
          compact
          label="Confirm password"
          name={`signup-${role}-confirm-password`}
          autoComplete="new-password"
          type="password"
          value={form.confirmPassword}
          onChange={(confirmPassword) => setForm({ ...form, confirmPassword })}
        />
        <button className="w-full rounded-md bg-coffee-700 px-4 py-2 font-black text-cream hover:bg-coffee-800">
          Create Account
        </button>
        <div className="flex flex-wrap justify-between gap-2 text-sm font-bold text-coffee-700">
          <Link to="/" className="hover:underline">
            Go to home
          </Link>
          <Link to="/login" className="hover:underline">
            Already have account? Login
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
