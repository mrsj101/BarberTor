import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Profile = {
  id: string;
  first_name: string;
  phone: string;
  is_admin: boolean;
};

interface SessionContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined
);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The onAuthStateChange listener is the single source of truth.
    // It fires once immediately with the initial session state from localStorage,
    // and then again whenever the auth state changes (login, logout).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      // If there's a user, fetch their profile. Otherwise, clear it.
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData || null);
      } else {
        setProfile(null);
      }

      // Crucially, once we have the initial auth state (even if it's null),
      // we are no longer in a loading state.
      setLoading(false);
    });

    // Cleanup the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will automatically handle clearing the session and profile state.
  };

  const value = {
    session,
    user: session?.user ?? null,
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
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};