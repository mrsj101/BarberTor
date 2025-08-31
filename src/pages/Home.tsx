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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>טוען...</p>
      </div>
    );
  }

  if (!session) {
    // This case is handled by the useEffect, but as a fallback
    return null;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">שגיאה בטעינת הפרופיל</h2>
        <p className="text-muted-foreground mb-6">
          לא הצלחנו לטעון את פרטי המשתמש שלך. ייתכן שיש בעיה בחיבור או שהחשבון שלך לא הוגדר כראוי.
        </p>
        <Button onClick={async () => {
          await logout();
          navigate('/login');
        }} variant="destructive">
          התנתק ונסה להתחבר שוב
        </Button>
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