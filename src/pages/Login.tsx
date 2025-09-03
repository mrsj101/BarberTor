import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message || "האימייל או הסיסמה שגויים");
      } else {
        // The onAuthStateChange listener in SessionContext will handle the redirect
        // and profile fetching. We just need to wait for the session to be established.
        // Navigating immediately can sometimes cause race conditions.
        // A simple navigation to home should be fine as ProtectedRoute will handle it.
        navigate("/");
      }
    } catch (e: any) {
      console.error("An unexpected error occurred during login:", e);
      setError(e.message || "אירעה שגיאה בלתי צפויה. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="welcome-text-box">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="welcome-tagline">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="welcome-tagline">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="********"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-red-500 text-sm welcome-tagline">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "מתחבר..." : "התחברות"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm welcome-tagline">
            <span>משתמש חדש? </span><br/>
            <Link to="/signup" className="underline text-primary welcome-tagline">
              הרשמה
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
