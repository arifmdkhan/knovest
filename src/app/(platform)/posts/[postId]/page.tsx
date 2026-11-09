import { PostContent } from "./_components/PostContent";

export default async function PostDetailsPage({ params }: { params: Promise<{ postId: string }> }) {
  return <PostContent postId={(await params).postId} />;
}
