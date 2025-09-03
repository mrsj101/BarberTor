import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SignUp = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptTerms) {
      setError("יש לאשר את תנאי השימוש והסכמה לדיוור.");
      return;
    }
    if (!firstName || !lastName || !phone || !email || !birthDate) {
      setError("יש למלא את כל השדות.");
      return;
    }
    if (password.length < 6) {
      setError("סיסמה חייבת לכלול 6 תווים לפחות");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            birth_date: birthDate,
            full_name: `${firstName} ${lastName}`,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      
      if (error) {
        setError(error.message);
        return;
      } 
      
      if (data?.user) {
        // We no longer insert directly to profiles here to avoid RLS issues
        // A DB trigger will create the profile using the metadata sent above
        console.log("User created:", data.user.id);
        alert("נשלח אליך אימייל אימות. יש לאשר אותו כדי להשלים את ההרשמה.");
        navigate("/login");
      }
    } catch (e: any) {
      console.error("An unexpected error occurred during sign up:", e);
      setError(e.message || "אירעה שגיאה בלתי צפויה. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="welcome-text-box max-w-sm mx-auto p-3">
          <form onSubmit={handleSignUp} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="welcome-tagline text-sm">שם פרטי</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="welcome-tagline text-sm">שם משפחה</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="welcome-tagline text-sm">טלפון</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="welcome-tagline text-sm">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="birthDate" className="welcome-tagline text-sm">תאריך לידה</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="welcome-tagline text-sm">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-8"
              />
            </div>
            <div className="flex items-start gap-2 mt-2">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                className="mt-1"
              />
              <Label htmlFor="acceptTerms" className="text-xs text-white">
                אני מאשר/ת את <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-primary">תנאי השימוש</a> ומסכים/ה לקבל דיוור ועדכונים.
              </Label>
            </div>
            <div className="text-xs text-white bg-black/30 p-2 rounded mt-2">
              <b>דיסקליימר:</b> בהרשמה לאתר אתה מאשר קבלת דיוור, עדכונים ומידע שיווקי בהתאם לחוק הספאם. תוכל להסיר את עצמך מרשימת התפוצה בכל עת.
            </div>
            {error && <p className="text-red-500 text-xs welcome-tagline bg-black/30 p-1 rounded">{error}</p>}
            <Button type="submit" className="w-full h-8 mt-2" disabled={loading}>
              {loading ? "יוצר חשבון..." : "הרשמה"}
            </Button>
          </form>
          <div className="mt-3 text-center text-xs welcome-tagline">
            <span>כבר רשום?</span><br/>
            <Link to="/login" className="underline text-primary welcome-tagline inline-block mt-2">
              התחברות
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;