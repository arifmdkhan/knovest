import { ProfileContent } from "../_components/ProfileContent";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({ title: "User Profile", description: "User profile page" });

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  return <ProfileContent username={(await params).username} />;
}
