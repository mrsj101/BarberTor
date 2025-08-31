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
    // This effect handles redirection AFTER the loading is complete.
    if (!loading && !session) {
      navigate("/login");
    }
  }, [session, loading, navigate]);

  // 1. Show loading indicator ONLY while the initial session is being checked.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>טוען...</p>
      </div>
    );
  }

  // After loading, if there's no session, the useEffect above will redirect.
  // Return null to prevent any flicker of content before redirection.
  if (!session) {
    return null;
  }

  // 2. Handle the critical error state: user is logged in but profile data is missing.
  // This is what caused the infinite loop before. Now it's a clear error page.
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

  // 3. Success case: User is logged in and has a profile. Render the correct dashboard.
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