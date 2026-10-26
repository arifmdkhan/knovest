"use client";
import Link from "next/link";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><main style={{ maxWidth: 560, margin: "15vh auto", padding: 24, fontFamily: "system-ui" }}><h1>Knovest is temporarily unavailable</h1><p>Try again shortly.</p><button onClick={reset}>Try again</button> <Link href="/">Return home</Link></main></body></html>;
}

