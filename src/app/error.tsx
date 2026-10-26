"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center"><h1 className="text-2xl font-semibold">This page could not load</h1><p>Please try again shortly.</p><Button onClick={reset}>Try again</Button><Link className="underline" href="/">Return home</Link></main>;
}

