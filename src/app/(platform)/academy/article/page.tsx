import { ArticleCatalogue } from "./_components/ArticleCatalogue";

export default async function ArticleListPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  return <ArticleCatalogue category={(await searchParams).category} />;
}
