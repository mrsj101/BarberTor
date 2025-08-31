import { useSession } from "@/contexts/SessionContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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

  // Later, we will render AdminDashboard or ClientDashboard based on profile.is_admin
  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl">שלום, {profile.first_name}</h1>
        <Button onClick={logout} variant="destructive">
          התנתקות
        </Button>
      </div>
      <div className="mt-8">
        {profile.is_admin ? (
          <p>ברוך הבא, אדמין! כאן יוצג ממשק הניהול.</p>
        ) : (
          <p>ברוך הבא! כאן יוצג מסך הבית ללקוחות.</p>
        )}
      </div>
    </div>
  );
};

export default Home;