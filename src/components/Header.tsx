"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Capy } from "./Capy";
import { useShelf } from "@/lib/store";
import { usePresentMode } from "@/lib/present";

const STEPS = [
  { href: "/scan", n: 1, label: "Scan once" },
  { href: "/label", n: 2, label: "Snap the label" },
  { href: "/verdict", n: 3, label: "Verdict" },
  { href: "/compare", n: 4, label: "Compare" },
];

export function Header() {
  const path = usePathname();
  const { mode } = useShelf();
  usePresentMode(); // remembers ?present=1 for the tab, whatever page it was opened on
  return (
    <header className="border-b border-line bg-sand/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0" data-testid="nav-home">
          <Capy size={40} title="Capy Shelf home" />
          <span className="font-extrabold text-lg tracking-tight">Capy Shelf</span>
        </Link>
        <nav aria-label="Steps" className="hidden md:flex items-center gap-1 mx-auto">
          {STEPS.map((s) => {
            const active = path === s.href;
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={active ? "step" : undefined}
                data-testid={`nav-step-${s.n}`}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-ink text-white" : "text-muted hover:bg-sand-2"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid place-items-center w-6 h-6 rounded-full text-xs ${
                    active ? "bg-white text-ink" : "bg-sand-2 text-ink"
                  }`}
                >
                  {s.n}
                </span>
                {s.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto md:ml-0 flex items-center gap-2">
          <span
            data-testid="mode-pill"
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              mode === "replay" ? "bg-water/10 text-water" : "bg-good-bg text-good"
            }`}
          >
            {mode === "replay" ? "Replay" : "Live"}
          </span>
          <Link href="/how" className="text-sm font-semibold underline underline-offset-4 px-2 py-2" data-testid="nav-how">
            How it works
          </Link>
        </div>
      </div>
      <nav aria-label="Steps" className="md:hidden flex gap-1 overflow-x-auto px-4 pb-2">
        {STEPS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={path === s.href ? "step" : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              path === s.href ? "bg-ink text-white" : "bg-sand-2 text-ink"
            }`}
          >
            {s.n}. {s.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
