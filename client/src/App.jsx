import { Navigate, Route, Routes } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import ProfitPage from "./pages/ProfitPage.jsx";
import Register from "./pages/Register.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import StockPage from "./pages/StockPage.jsx";
import WorkerPanel from "./pages/WorkerPanel.jsx";
import { useAuth } from "./state/AuthContext.jsx";

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/worker"
        element={
          <ProtectedRoute roles={["worker", "admin"]}>
            <WorkerPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute roles={["worker", "admin"]}>
            <StockPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profit"
        element={
          <ProtectedRoute roles={["admin"]}>
            <ProfitPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute roles={["admin"]}>
            <SalesPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
