import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getStoredMode, setStoredMode, type DataMode } from "@/lib/config";
import { demoApi } from "./demo";
import { httpApi } from "./http";
import type { ApiService } from "./types";

interface ApiCtx {
  api: ApiService;
  mode: DataMode;
  setMode: (m: DataMode) => void;
}
const Ctx = createContext<ApiCtx | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataMode>("demo");
  const qc = useQueryClient();
  useEffect(() => setModeState(getStoredMode()), []);
  const value = useMemo<ApiCtx>(
    () => ({
      mode,
      api: mode === "live" ? httpApi : demoApi,
      setMode: (m) => {
        setStoredMode(m);
        setModeState(m);
        qc.clear();
      },
    }),
    [mode, qc],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApi() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApi must be used inside ApiProvider");
  return c;
}

export * from "./types";
