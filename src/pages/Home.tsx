import { useSession } from "@/contexts/SessionContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ClientDashboard from "@/pages/client/ClientDashboard";

const Home = () => {
  const { session, profile, loading, logout } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/login");
    }
  }, [session, loading, navigate]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">שלום, {profile.first_name}</h1>
        <Button onClick={logout} variant="destructive">
          התנתקות
        </Button>
      </header>
      <main>
        {profile.is_admin ? <AdminDashboard /> : <ClientDashboard />}
      </main>
    </div>
  );
};

export default Home;