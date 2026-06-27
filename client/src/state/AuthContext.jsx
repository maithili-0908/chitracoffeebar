import { createContext, useContext, useMemo, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("chitraUser");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    localStorage.setItem("chitraToken", data.token);
    localStorage.setItem("chitraUser", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("chitraToken", data.token);
    localStorage.setItem("chitraUser", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("chitraToken");
    localStorage.removeItem("chitraUser");
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, register, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
