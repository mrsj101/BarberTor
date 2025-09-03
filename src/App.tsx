import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "./contexts/SessionContext";
import SplashScreen from "./pages/SplashScreen";
const Welcome = lazy(() => import("./pages/Welcome"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
import NotFound from "./pages/NotFound";
import BookAppointment from "./pages/client/BookAppointment";
import RescheduleAppointment from "./pages/client/RescheduleAppointment";
import CancelAppointment from "./pages/client/CancelAppointment";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import CalendarPage from "./pages/admin/CalendarPage";
import RequestsPage from "./pages/admin/RequestsPage";
import AppointmentsManagementPage from "./pages/admin/AppointmentsManagementPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ClientsManagementPage from "./pages/admin/ClientsManagementPage";
import SettingsPage from "./pages/admin/SettingsPage";
const ServicesManagementPage = lazy(() => import("./pages/admin/ServicesManagementPage"));

const App = () => {
  const { loading: authLoading } = useSession();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    // Timer for minimum splash screen time
    const minTimeTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500);

    // Safety net timer for authentication
    const authTimeoutTimer = setTimeout(() => {
      if (authLoading) {
        setAuthTimedOut(true);
      }
    }, 8000); // 8 seconds timeout for auth

    return () => {
      clearTimeout(minTimeTimer);
      clearTimeout(authTimeoutTimer);
    };
  }, [authLoading]);

  // Show splash screen if (minimum time has NOT elapsed OR auth is still loading) AND auth has NOT timed out.
  if ((!minTimeElapsed || authLoading) && !authTimedOut) {
    return <SplashScreen />;
  }

  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Public routes */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<BookAppointment />} />
          <Route path="/reschedule" element={<RescheduleAppointment />} />
          <Route path="/cancel" element={<CancelAppointment />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="appointments" element={<AppointmentsManagementPage />} />
            <Route path="clients" element={<ClientsManagementPage />} />
            <Route path="services" element={<ServicesManagementPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;