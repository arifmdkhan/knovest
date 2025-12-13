import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambient Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 text-center space-y-8 max-w-lg mx-auto">
                <div className="space-y-2">
                    <h1 className="text-9xl font-extrabold tracking-tighter text-primary/20 select-none">
                        404
                    </h1>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Page not found
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or doesn't exist.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/">
                            <Home className="w-4 h-4" />
                            Go Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="gap-2">
                        <Link href="/academy">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Academy
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
