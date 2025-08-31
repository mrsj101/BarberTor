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

  const getProfile = async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error.message);
        setProfile(null);
      } else {
        setProfile(profileData || null);
      }
    } catch (e) {
      console.error("An unexpected error occurred while fetching profile:", e);
      setProfile(null);
    }
  };

  useEffect(() => {
    const initializeAndListen = async () => {
      // 1. Get the initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      
      // 2. Get the initial profile based on the session
      await getProfile(initialSession?.user ?? null);
      
      // 3. Mark initial loading as complete
      setLoading(false);

      // 4. Set up a listener for any future auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          setSession(newSession);
          await getProfile(newSession?.user ?? null);
        }
      );

      return subscription;
    };

    const subscriptionPromise = initializeAndListen();

    // Cleanup the subscription on component unmount
    return () => {
      subscriptionPromise.then(subscription => subscription?.unsubscribe());
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will handle clearing the session and profile state.
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