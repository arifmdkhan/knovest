
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./_components/SettingsSidebar";

const sidebarNavItems = [
    {
        title: "Account",
        href: "/settings/account",
    },
    {
        title: "Subscriptions",
        href: "/settings/subscriptions",
    },
];

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="space-y-6 p-4 pb-16 md:p-10 md:pb-16 w-full">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-32 lg:space-y-0">
                <aside className="lg:mx-0 lg:w-64 shrink-0 overflow-x-auto px-4 lg:pr-4">
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className="flex-1 lg:max-w-2xl">{children}</div>
            </div>
        </div>
    );
}
