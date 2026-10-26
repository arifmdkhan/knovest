
import { AppHero } from "@/components/AppHero";
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
        <div className="space-y-7 pb-10 w-full">
            <AppHero title="Settings" description="Make Knovest yours. Manage your account and preferences." />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0">
                <aside className="lg:w-48 shrink-0 overflow-x-auto">
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className="app-panel min-w-0 flex-1 p-6 lg:max-w-3xl">{children}</div>
            </div>
        </div>
    );
}
