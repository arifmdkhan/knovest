import { requireUser } from "@/features/user/queries/require-user";
import { ChatProvider } from "./_components/ChatProvider";

export default async function Layout({ children }: { children: React.ReactNode }) {
    const user = await requireUser();

    return (
        <ChatProvider user={user}>
            {children}
        </ChatProvider>
    );
}
