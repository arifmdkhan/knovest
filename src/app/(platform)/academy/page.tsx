import { AcademyContent } from "./_components/AcademyContent";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({ title: "Academy", description: "Build your knowledge with expert-led courses and articles on Knovest." });

export default function AcademyPage() { return <AcademyContent />; }
