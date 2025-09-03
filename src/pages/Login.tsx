import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message || "האימייל או הסיסמה שגויים");
      } else if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setError("יש לאשר את האימייל לפני התחברות.");
      } else {
        navigate("/");
      }
    } catch (e: unknown) {
      console.error("An unexpected error occurred during login:", e);
      const message = e instanceof Error ? e.message : "אירעה שגיאה בלתי צפויה. אנא נסה שוב.";
      setError(message);
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="********"
                  autoComplete="current-password"
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
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
