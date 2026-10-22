import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// DEVELOPMENT-ONLY PREVIEW AUTH. This is client-side state, not secure
// authentication. Replace with a real backend auth provider before production.

export interface PreviewUser {
  name: string;
  email: string;
}
interface AuthCtx {
  user: PreviewUser | null;
  ready: boolean;
  signIn: (u: PreviewUser) => void;
  signOut: () => void;
  update: (u: Partial<PreviewUser>) => void;
}
const KEY = "promptiq.previewUser";
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PreviewUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raw = window.localStorage.getItem(KEY);
    if (raw)
      try {
        setUser(JSON.parse(raw) as PreviewUser);
      } catch {
        /* ignore */
      }
    setReady(true);
  }, []);
  const persist = (u: PreviewUser | null) => {
    setUser(u);
    if (u) window.localStorage.setItem(KEY, JSON.stringify(u));
    else window.localStorage.removeItem(KEY);
  };
  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        signIn: persist,
        signOut: () => persist(null),
        update: (p) => user && persist({ ...user, ...p }),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
