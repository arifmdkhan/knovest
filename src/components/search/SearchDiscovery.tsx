"use client";

import { useSyncExternalStore } from "react";
import Link from "@/components/AppLink";
import { Clock3, Compass, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener("knovest-search-history", onChange);
  return () => { window.removeEventListener("storage", onChange); window.removeEventListener("knovest-search-history", onChange); };
};
const getHistory = () => { try { return localStorage.getItem("knovest-recent-searches") || "[]"; } catch { return "[]"; } };

export function SearchDiscovery() {
  const stored = useSyncExternalStore(subscribe, getHistory, () => "[]");
  let recent: string[] = [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (Array.isArray(parsed)) recent = parsed.filter((value): value is string => typeof value === "string").slice(0, 5);
  } catch { /* Ignore invalid optional history. */ }
  const clear = () => {
    try { localStorage.removeItem("knovest-recent-searches"); window.dispatchEvent(new Event("knovest-search-history")); } catch { /* Optional history. */ }
  };
  return <div className="grid gap-5 md:grid-cols-2">
    <section className="app-panel p-6">
      <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Clock3 className="size-4 text-primary" />Recent searches</h2>{recent.length > 0 && <Button variant="ghost" onClick={clear} className="text-xs text-muted-foreground">Clear all</Button>}</div>
      {recent.length ? <ul>{recent.map(query => <li key={query}><Link className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" href={`/search?q=${encodeURIComponent(query)}`}>{query}<ArrowUpRight className="size-4" /></Link></li>)}</ul> : <p className="py-6 text-sm leading-relaxed text-muted-foreground">Your recent searches will appear here. Find a person, course, or idea to get started.</p>}
    </section>
    <section className="app-panel p-6">
      <h2 className="mb-5 flex items-center gap-2 font-semibold"><Compass className="size-4 text-primary" />Explore topics</h2>
      <div className="flex flex-wrap gap-2">{["Technical Analysis", "Risk Management", "Options", "Personal Finance", "Investing"].map(topic => <Link className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary" key={topic} href={`/search?q=${encodeURIComponent(topic)}`}>{topic}</Link>)}</div>
    </section>
  </div>;
}
