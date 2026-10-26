import { PageSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
    return <main className="knovest-app min-h-dvh bg-background px-6 py-10"><div className="mx-auto max-w-6xl"><PageSkeleton /></div></main>;
}
