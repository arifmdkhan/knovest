import { getStreamToken } from "@/features/media/actions/stream.action";
import { requireUser } from "@/features/user/queries/require-user";
import { ChatProvider } from "./_components/ChatProvider";

export default async function Layout({ children }: { children: React.ReactNode }) {
    const user = await requireUser();
    const res = await getStreamToken({});

    return (
        <ChatProvider user={user} streamToken={res.status === "success" ? res.data || "" : ""}>
            {children}
        </ChatProvider>
    );
}