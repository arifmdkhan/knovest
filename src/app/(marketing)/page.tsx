import MarketingPage from "./_components/Marketing";
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  alternates: { canonical: "/" },
  title: "The Financial Learning Network",
  description:
    "Explore financial learning, thoughtful conversations, courses, and live discussions with the Knovest community.",
});

export default function Landing() {
  return (
    <>
      <MarketingPage />
    </>
  );
}
