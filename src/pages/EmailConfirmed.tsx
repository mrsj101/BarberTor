import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const EmailConfirmed = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="welcome-text-box max-w-sm mx-auto p-3 text-center space-y-4">
          <p className="welcome-tagline">האימייל שלך אושר בהצלחה!</p>
          <Button asChild className="w-full h-8">
            <Link to="/login">להתחברות</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmed;
