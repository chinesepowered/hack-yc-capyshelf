"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_PROFILES, DEMO_SHELF } from "@/fixtures";
import type { Product, SkinProfile } from "./types";

export type Mode = "replay" | "live";

type State = {
  mode: Mode;
  profileId: string;
  productId: string;
  compareIds: string[];
  liveProfiles: SkinProfile[];
  liveProducts: Product[];
  liveExplanations: Record<string, { text: string; model: string; elapsedMs: number }>;
};

const INITIAL: State = {
  mode: "replay",
  profileId: "demo-a",
  productId: "dew-drink-gel-cream",
  compareIds: DEMO_SHELF.map((p) => p.id),
  liveProfiles: [],
  liveProducts: [],
  liveExplanations: {},
};

type Ctx = State & {
  ready: boolean;
  profiles: SkinProfile[];
  products: Product[];
  profile: SkinProfile;
  product: Product;
  set: (patch: Partial<State>) => void;
  addLiveProfile: (p: SkinProfile) => void;
  addLiveProduct: (p: Product) => void;
  saveExplanation: (key: string, v: { text: string; model: string; elapsedMs: number }) => void;
  reset: () => void;
};

const ShelfContext = createContext<Ctx | null>(null);
const KEY = "capy-shelf-v1";

export function ShelfProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(INITIAL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setState({ ...INITIAL, ...(JSON.parse(saved) as Partial<State>) });
    } catch {
      /* storage unavailable: start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const set = useCallback((patch: Partial<State>) => setState((s) => ({ ...s, ...patch })), []);

  const value = useMemo<Ctx>(() => {
    const profiles = [...DEMO_PROFILES, ...state.liveProfiles];
    const products = [...DEMO_SHELF, ...state.liveProducts];
    const profile = profiles.find((p) => p.id === state.profileId) ?? profiles[0];
    const product = products.find((p) => p.id === state.productId) ?? products[0];
    return {
      ...state,
      ready,
      profiles,
      products,
      profile,
      product,
      set,
      addLiveProfile: (p) =>
        setState((s) => ({
          ...s,
          liveProfiles: [...s.liveProfiles.filter((x) => x.id !== p.id), p],
          profileId: p.id,
        })),
      addLiveProduct: (p) =>
        setState((s) => ({
          ...s,
          liveProducts: [...s.liveProducts.filter((x) => x.id !== p.id), p],
          productId: p.id,
          compareIds: [p.id, ...s.compareIds.filter((id) => id !== p.id)].slice(0, 3),
        })),
      saveExplanation: (key, v) =>
        setState((s) => ({ ...s, liveExplanations: { ...s.liveExplanations, [key]: v } })),
      reset: () => setState(INITIAL),
    };
  }, [state, ready, set]);

  return <ShelfContext.Provider value={value}>{children}</ShelfContext.Provider>;
}

export function useShelf(): Ctx {
  const ctx = useContext(ShelfContext);
  if (!ctx) throw new Error("useShelf must be used inside ShelfProvider");
  return ctx;
}
