import { Coffee, Home, LogOut, PackagePlus, ReceiptText, ShieldCheck, Warehouse, TrendingUp } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
    window.location.replace("/");
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-coffee-200 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-wide text-coffee-800">
            <Coffee className="h-6 w-6 text-coffee-600" />
            Chitra Coffee Bar ☕
          </Link>

          <nav className="flex items-center gap-2">
            <NavLink className="hidden rounded-md px-3 py-2 text-sm font-bold text-coffee-700 hover:bg-coffee-100 sm:flex" to="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </NavLink>
            {user?.role === "admin" && (
              <>
                <NavLink className="hidden rounded-md px-3 py-2 text-sm font-bold text-coffee-700 hover:bg-coffee-100 sm:flex" to="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin
                </NavLink>
                <NavLink className="hidden rounded-md px-3 py-2 text-sm font-bold text-coffee-700 hover:bg-coffee-100 sm:flex" to="/profit">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Profit
                </NavLink>
                <NavLink className="hidden rounded-md px-3 py-2 text-sm font-bold text-coffee-700 hover:bg-coffee-100 sm:flex" to="/sales">
                  <ReceiptText className="mr-2 h-4 w-4" />
                  Sales
                </NavLink>
              </>
            )}
            {user && (
              <>
                <NavLink className="hidden rounded-md px-3 py-2 text-sm font-bold text-coffee-700 hover:bg-coffee-100 sm:flex" to="/worker">
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Items
                </NavLink>
                <NavLink className="hidden rounded-md px-3 py-2 text-sm font-bold text-coffee-700 hover:bg-coffee-100 sm:flex" to="/stock">
                  <Warehouse className="mr-2 h-4 w-4" />
                  Stock
                </NavLink>
              </>
            )}
            {!user ? (
              <>
                <Link className="rounded-md border border-coffee-500 px-4 py-2 text-sm font-bold text-coffee-700 hover:bg-coffee-100" to="/login">
                  Login
                </Link>
                <Link className="rounded-md bg-coffee-700 px-4 py-2 text-sm font-bold text-cream hover:bg-coffee-800" to="/signin">
                  Sign in
                </Link>
              </>
            ) : (
              <button onClick={handleLogout} className="rounded-md border border-coffee-300 p-2 text-coffee-700 hover:bg-coffee-100" title="Logout">
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
