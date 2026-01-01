import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { FeedCard } from "../../home/_components/FeedCard";
import { CreateCommentForm } from "../../home/_components/comments/components/create-comment-form";
import { CommentList } from "../../home/_components/comments/components/comment-list";
import { getPost } from "@/features/posts/queries/get-post";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailsPage({ params }: PageProps) {
  const { postId } = await params;

  if (!postId) return notFound();

  let post;

  try {
    post = await getPost(postId);
  } catch (error) {
    console.error("Post Detail Error:", error);
    return notFound();
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-6 px-4">
      {/* Back Button */}
      <Link href="/home" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Feed
      </Link>

      <FeedCard post={post} />

      <div className="mt-6 bg-card border border-border/60 rounded-xl p-4 sm:p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Comments</h3>

        <div className="mb-6">
          <CreateCommentForm postId={postId} />
        </div>

        <Separator className="my-6" />

        <CommentList postId={postId} />
      </div>
    </div>
  );
}