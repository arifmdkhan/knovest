import { SiteFooter } from "./_components/SiteFooter";
import { SiteHeader } from "./_components/SiteHeader";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20">
            <SiteHeader />
            <main className="flex-1">
                {children}
            </main>
            <SiteFooter />
        </div>
    );
}
