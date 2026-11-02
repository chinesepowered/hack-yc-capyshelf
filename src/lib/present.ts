"use client";

import { useEffect, useState } from "react";

/**
 * Presentation mode (?present=1, remembered for the tab): shows the model as a generic
 * "vision language model" instead of its product name, so the recorded demo video
 * carries no third-party names besides the YouCam API it is about.
 */
export function usePresentMode(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("present");
      if (q === "1") sessionStorage.setItem("capy-present", "1");
      if (q === "0") sessionStorage.removeItem("capy-present");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOn(sessionStorage.getItem("capy-present") === "1");
    } catch {
      setOn(false);
    }
  }, []);
  return on;
}

export function modelName(model: string | undefined, present: boolean): string {
  if (!model) return "";
  return present ? "a vision language model" : model;
}
