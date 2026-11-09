import { ArticleContent } from "../_components/ArticleContent";

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ArticleContent slug={(await params).slug} />;
}
