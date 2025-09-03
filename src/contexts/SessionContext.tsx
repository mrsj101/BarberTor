import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

type Profile = {
  id: string;
  first_name: string | null;
  is_admin: boolean;
};

type SessionContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Start as true!
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle state cleanup
    navigate("/login");
  };

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("id, first_name, is_admin")
          .eq("id", userId)
          .maybeSingle(); // avoid 406 from Accept negotiation

        if (!mounted) return;
        if (error) {
          console.warn("Error fetching profile:", error.message);
          setProfile(null);
        } else {
          setProfile((profileData as Profile) || null);
        }
      } catch (err) {
        if (!mounted) return;
        console.warn("Unexpected error fetching profile", err);
        setProfile(null);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Safety net for stuck loading state
  useEffect(() => {
    if (!loading) return; // If loading is already false, do nothing.

    const timer = setTimeout(() => {
      // If after 5 seconds, we are still in a loading state, force it to end.
      console.warn("Auth state check timed out. Forcing loading to end.");
      setLoading(false);
      setSession(null);
      setUser(null);
      setProfile(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading]);

  const value = {
    session,
    user,
    profile,
    loading,
    logout,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};