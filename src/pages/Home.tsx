import { useSession } from "@/contexts/SessionContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import ClientDashboard from "@/pages/client/ClientDashboard";

const Home = () => {
  const { session, profile, loading, logout } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        navigate("/login");
      } else if (profile?.is_admin) {
        navigate("/admin/dashboard");
      }
    }
  }, [session, profile, loading, navigate]);

  if (loading || !session || profile?.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>טוען...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">שגיאה בטעינת הפרופיל</h2>
        <p className="text-muted-foreground mb-6">
          לא הצלחנו לאמת את פרטי המשתמש שלך. אנא התנתק ונסה להתחבר שוב.
        </p>
        <Button onClick={logout} variant="destructive">
          התנתקות
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col items-center gap-4 mb-8 md:flex-row md:justify-between">
        <h1 className="text-3xl font-bold text-center">שלום, {profile.first_name}</h1>
        <Button onClick={logout} variant="destructive">
          התנתקות
        </Button>
      </header>
      <main>
        <ClientDashboard />
      </main>
    </div>
  );
};

export default Home;