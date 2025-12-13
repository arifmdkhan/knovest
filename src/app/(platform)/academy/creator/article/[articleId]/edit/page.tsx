import { getArticle } from "@/app/data/article/get-article";
import { EditArticleForm } from "./_components/edit-article-form";

export default async function EditArticlePage({
    params,
}: {
    params: Promise<{ articleId: string }>;
}) {
    const { articleId } = await params;
    const article = await getArticle(articleId);

    return <EditArticleForm article={article} />;
}
