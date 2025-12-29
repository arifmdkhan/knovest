import MarketingPage from "./_components/Marketing";
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Consensus | The Financial Learning Network",
  description: "Join the first social network dedicated to financial mastery. Connect with SEBI registered experts, join live trade rooms, and access premium courses.",
});

export default function Landing() {
  return (
    <>
      <MarketingPage />
    </>
  );
}
